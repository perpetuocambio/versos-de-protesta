#!/usr/bin/env node

/**
 * INTEGRACIÓN INTELIGENTE DE DATOS CHINOS
 * =======================================
 * 
 * Une automáticamente los datos del diccionario chino (zh.json) con el sistema de radicales.
 * Extrae automáticamente información de radicales, pinyin y definiciones
 * desde el diccionario existente en lugar de mantenerla manualmente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de rutas
const PROJECT_ROOT = path.join(__dirname, '..');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'zh.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese');

console.log('🔥 INTEGRACIÓN INTELIGENTE DE DATOS CHINOS');
console.log('==========================================');
console.log('Unificando diccionario chino con sistema de radicales...\n');

/**
 * Extrae información de radical desde texto como "戈 (lanza)"
 */
function extractRadicalInfo(radicalText) {
    if (!radicalText || typeof radicalText !== 'string') {
        return { radical: '一', meaning: 'desconocido' };
    }
    
    // Patrón: "戈 (lanza)" -> radical: "戈", meaning: "lanza"
    const match = radicalText.match(/^([^\s(]+)\s*\(([^)]+)\)/);
    if (match) {
        return {
            radical: match[1],
            meaning: match[2]
        };
    }
    
    // Si no hay paréntesis, usar el texto completo como radical
    return {
        radical: radicalText.trim(),
        meaning: 'desconocido'
    };
}

/**
 * Extrae caracteres individuales de palabras compuestas
 */
function extractIndividualCharacters(word) {
    const characters = [];
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        // Verificar que es un carácter chino (CJK Unified Ideographs)
        if (/[\u4e00-\u9fff]/.test(char)) {
            characters.push(char);
        }
    }
    return characters;
}

/**
 * Convierte número de trazos desde texto
 */
function parseStrokes(strokesText) {
    if (!strokesText) return null;
    const num = parseInt(strokesText);
    return isNaN(num) ? null : num;
}

/**
 * Carga y procesa el diccionario chino
 */
async function loadChineseDictionary() {
    console.log('📖 Cargando diccionario chino...');
    
    if (!fs.existsSync(DICTIONARY_PATH)) {
        throw new Error(`No se encontró el diccionario: ${DICTIONARY_PATH}`);
    }
    
    const dictionaryData = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
    console.log(`✅ Diccionario cargado: ${dictionaryData.meta.wordCount} palabras`);
    
    return dictionaryData;
}

/**
 * Procesa los datos del diccionario para extraer información de caracteres y radicales
 */
function processDictionaryData(dictionaryData) {
    console.log('\n📊 PROCESANDO DATOS DEL DICCIONARIO...');
    
    const radicalsMap = new Map(); // radical -> info del radical
    const charactersMap = new Map(); // carácter -> info del carácter
    
    let totalWords = 0;
    let totalCharacters = 0;
    
    // Procesar cada palabra en el diccionario
    Object.entries(dictionaryData.words).forEach(([word, wordData]) => {
        totalWords++;
        
        // Extraer información directamente del wordData (nuevo formato)
        const pinyin = wordData.translations?.zhPinyin;
        const radicalText = wordData.zhRadical;
        const strokes = wordData.zhStrokes;
        const structure = wordData.zhStructure;
        const lessons = wordData.lessons || [];
        const firstAppearance = wordData.firstAppearance || 0;
        
        if (!pinyin || !radicalText) return;
        
        // Extraer info del radical
        const radicalInfo = extractRadicalInfo(radicalText);
        
        // Registrar el radical si es nuevo
        if (!radicalsMap.has(radicalInfo.radical)) {
            radicalsMap.set(radicalInfo.radical, {
                radical: radicalInfo.radical,
                meaning: {
                    es: radicalInfo.meaning,
                    en: radicalInfo.meaning, // TODO: Traducir automáticamente
                    de: radicalInfo.meaning,
                    pt: radicalInfo.meaning,
                    ru: radicalInfo.meaning,
                    'ru-rom': radicalInfo.meaning,
                    zh: radicalInfo.radical,
                    'zh-pinyin': 'unknown' // TODO: Obtener pinyin del radical
                },
                strokes: parseStrokes(strokes) || 1,
                category: 'general',
                characters: [],
                lessons: new Set(),
                firstAppearance: firstAppearance
            });
        }
        
        // Actualizar lecciones del radical
        const radicalData = radicalsMap.get(radicalInfo.radical);
        lessons.forEach(lesson => radicalData.lessons.add(lesson));
        if (firstAppearance < radicalData.firstAppearance) {
            radicalData.firstAppearance = firstAppearance;
        }
        
        // Extraer caracteres individuales de la palabra
        const individualChars = extractIndividualCharacters(word);
        
        individualChars.forEach((char, index) => {
            totalCharacters++;
            
            // Calcular pinyin del carácter individual (estimación)
            let charPinyin = pinyin;
            if (individualChars.length > 1 && pinyin && pinyin.includes(' ')) {
                const pinyinSyllables = pinyin.split(' ');
                charPinyin = pinyinSyllables[index] || pinyinSyllables[0];
            }
            
            // Si ya existe el carácter, fusionar información
            if (charactersMap.has(char)) {
                const existingChar = charactersMap.get(char);
                // Mantener información más completa
                if (!existingChar.pinyin && charPinyin) {
                    existingChar.pinyin = charPinyin;
                }
                existingChar.frequency = (existingChar.frequency || 0) + 1;
                existingChar.words.push(word);
                // Actualizar lecciones
                lessons.forEach(lesson => existingChar.lessons.add(lesson));
                if (firstAppearance < existingChar.firstAppearance) {
                    existingChar.firstAppearance = firstAppearance;
                }
            } else {
                // Crear nueva entrada de carácter
                charactersMap.set(char, {
                    character: char,
                    radical: radicalInfo.radical,
                    unicode: char.codePointAt(0),
                    pinyin: charPinyin,
                    strokes: parseStrokes(strokes),
                    structure: structure,
                    hasStrokeData: true, // Asumimos que sí
                    definitions: [`Used in: ${word} (${wordData.translations?.es || 'unknown meaning'})`],
                    frequency: 1,
                    words: [word],
                    lessons: new Set(lessons),
                    firstAppearance: firstAppearance,
                    source: 'dictionary_integration'
                });
            }
            
            // Añadir carácter a la lista del radical
            const radicalData = radicalsMap.get(radicalInfo.radical);
            if (radicalData && !radicalData.characters.includes(char)) {
                radicalData.characters.push(char);
            }
        });
    });
    
    console.log(`✅ Procesados: ${totalWords} palabras, ${totalCharacters} caracteres`);
    console.log(`✅ Radicales únicos encontrados: ${radicalsMap.size}`);
    console.log(`✅ Caracteres únicos: ${charactersMap.size}`);
    
    return {
        radicals: radicalsMap,
        characters: charactersMap
    };
}

/**
 * Genera los archivos finales unificados
 */
function generateUnifiedFiles(processedData, outputDir) {
    console.log('\n💾 GENERANDO ARCHIVOS UNIFICADOS...');
    
    // Asegurar que existe el directorio de salida
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    
    // Convertir Sets a Arrays para JSON
    const serializableRadicals = new Map();
    for (const [key, radical] of processedData.radicals.entries()) {
        serializableRadicals.set(key, {
            ...radical,
            lessons: Array.from(radical.lessons).sort((a, b) => a - b)
        });
    }
    
    const serializableCharacters = new Map();
    for (const [key, character] of processedData.characters.entries()) {
        serializableCharacters.set(key, {
            ...character,
            lessons: Array.from(character.lessons).sort((a, b) => a - b)
        });
    }
    
    // 1. Archivo de radicales consolidados
    const radicalsData = {
        metadata: {
            generated: timestamp,
            version: '3.0.0',
            description: 'Unified radical database extracted from Chinese dictionary',
            totalRadicals: serializableRadicals.size,
            sources: ['Internal Chinese dictionary', 'Automatic extraction', 'Dictionary integration'],
            languages: ['es', 'en', 'de', 'pt', 'ru', 'ru-rom', 'zh', 'zh-pinyin']
        },
        radicals: Object.fromEntries(serializableRadicals)
    };
    
    // 2. Archivo de mapeo de caracteres
    const charactersData = {
        metadata: {
            generated: timestamp,
            version: '3.0.0',
            description: 'Character-radical mapping with integrated dictionary data',
            totalCharacters: serializableCharacters.size,
            sources: ['Internal Chinese dictionary', 'Automatic radical detection'],
            languages: ['es', 'en', 'de', 'pt', 'ru', 'ru-rom', 'zh', 'zh-pinyin']
        },
        characters: Object.fromEntries(serializableCharacters)
    };
    
    // Escribir archivos
    const radicalsFile = path.join(outputDir, 'radicals-unified.json');
    const charactersFile = path.join(outputDir, 'character-radical-unified.json');
    
    fs.writeFileSync(radicalsFile, JSON.stringify(radicalsData, null, 2), 'utf8');
    fs.writeFileSync(charactersFile, JSON.stringify(charactersData, null, 2), 'utf8');
    
    console.log(`✅ Guardado: radicals-unified.json (${serializableRadicals.size} radicales)`);
    console.log(`✅ Guardado: character-radical-unified.json (${serializableCharacters.size} caracteres)`);
    
    return {
        radicalsFile,
        charactersFile,
        stats: {
            radicals: serializableRadicals.size,
            characters: serializableCharacters.size
        }
    };
}

/**
 * Función principal
 */
async function integrateChineseData() {
    try {
        // 1. Cargar diccionario
        const dictionaryData = await loadChineseDictionary();
        
        // 2. Procesar datos
        const processedData = processDictionaryData(dictionaryData);
        
        // 3. Generar archivos unificados
        const result = generateUnifiedFiles(processedData, OUTPUT_DIR);
        
        console.log('\n🎉 INTEGRACIÓN COMPLETADA');
        console.log('==========================');
        console.log(`📊 Estadísticas:`);
        console.log(`   • Radicales: ${result.stats.radicals}`);
        console.log(`   • Caracteres: ${result.stats.characters}`);
        console.log(`📁 Archivos generados en: ${OUTPUT_DIR}`);
        
    } catch (error) {
        console.error('💥 Error durante la integración:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    integrateChineseData();
}

export { integrateChineseData };