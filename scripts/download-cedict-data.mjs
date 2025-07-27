#!/usr/bin/env node

/**
 * DESCARGA Y PROCESAMIENTO DE CC-CEDICT PARA DATOS DE CARACTERES CHINOS
 * ====================================================================
 * 
 * Fuente: CC-CEDICT (Creative Commons Chinese-English Dictionary)
 * Licencia: Creative Commons Attribution-Share Alike 3.0
 * URL: https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz
 * 
 * Este script:
 * 1. Descarga CC-CEDICT completo (solo cuando sea necesario)
 * 2. Extrae datos de caracteres individuales usados en nuestro diccionario
 * 3. Genera JSON local con pinyin, definiciones, frecuencia de uso
 * 4. Complementa con datos de radicales Unicode Database
 * 
 * Ejecutar solo cuando se añadan nuevos caracteres chinos al diccionario
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'zh.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese');
const CEDICT_RAW_FILE = path.join(OUTPUT_DIR, 'cedict_raw.txt');
const CHARACTER_DATA_FILE = path.join(OUTPUT_DIR, 'character-data.json');
const CACHE_INFO_FILE = path.join(OUTPUT_DIR, 'cache-info.json');

// URLs de datos
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';

// Crear directorios si no existen
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Creado directorio: ${dirPath}`);
  }
}

// Extraer caracteres únicos del diccionario
function extractUniqueChineseCharacters() {
  console.log('📖 Leyendo diccionario chino...');
  
  if (!fs.existsSync(DICTIONARY_PATH)) {
    console.error(`❌ No se encontró el diccionario: ${DICTIONARY_PATH}`);
    process.exit(1);
  }
  
  const dictionaryData = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
  const uniqueChars = new Set();
  
  let wordCount = 0;
  
  // Buscar en la estructura del diccionario
  if (dictionaryData.index && dictionaryData.index.letters) {
    for (const [letter, words] of Object.entries(dictionaryData.index.letters)) {
      if (Array.isArray(words)) {
        for (const chineseWord of words) {
          wordCount++;
          // Extraer cada caracter individual
          for (let i = 0; i < chineseWord.length; i++) {
            const char = chineseWord[i];
            // Verificar que es un caracter chino (CJK Unified Ideographs)
            if (/[\u4e00-\u9fff]/.test(char)) {
              uniqueChars.add(char);
            }
          }
        }
      }
    }
  }
  
  console.log(`📊 Estadísticas:`);
  console.log(`   - Palabras procesadas: ${wordCount}`);
  console.log(`   - Caracteres únicos encontrados: ${uniqueChars.size}`);
  
  return Array.from(uniqueChars).sort();
}

// Verificar si necesitamos descargar CC-CEDICT
function needsUpdate() {
  if (!fs.existsSync(CEDICT_RAW_FILE) || !fs.existsSync(CACHE_INFO_FILE)) {
    return true;
  }
  
  const cacheInfo = JSON.parse(fs.readFileSync(CACHE_INFO_FILE, 'utf8'));
  const daysSinceLastUpdate = (Date.now() - new Date(cacheInfo.lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
  
  // Actualizar si han pasado más de 30 días
  return daysSinceLastUpdate > 30;
}

// Descargar CC-CEDICT
async function downloadCEDICT() {
  return new Promise((resolve, reject) => {
    console.log('📥 Descargando CC-CEDICT desde MDBG...');
    console.log(`URL: ${CEDICT_URL}`);
    
    const file = fs.createWriteStream(CEDICT_RAW_FILE);
    
    https.get(CEDICT_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      console.log(`📦 Descargando archivo comprimido (${response.headers['content-length']} bytes)...`);
      
      // Descomprimir gzip y escribir a archivo
      const gunzip = zlib.createGunzip();
      response.pipe(gunzip).pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ CC-CEDICT descargado: ${CEDICT_RAW_FILE}`);
        
        // Actualizar info de cache
        const cacheInfo = {
          lastUpdate: new Date().toISOString(),
          source: 'CC-CEDICT from MDBG',
          license: 'Creative Commons Attribution-Share Alike 3.0',
          url: CEDICT_URL
        };
        fs.writeFileSync(CACHE_INFO_FILE, JSON.stringify(cacheInfo, null, 2));
        
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(CEDICT_RAW_FILE, () => {}); // Borrar archivo parcial
        reject(err);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Parsear línea de CC-CEDICT
function parseCEDICTLine(line) {
  // Formato CC-CEDICT: 简体 繁体 [pinyin] /definition1/definition2/
  // Ejemplo: 人 人 [ren2] /person; people/CL:個|个[ge4],位[wei4]/
  
  if (line.startsWith('#') || line.trim() === '' || line.startsWith('%')) {
    return null;
  }
  
  // Regex más flexible para manejar el formato real
  const match = line.match(/^(.+?)\s+(.+?)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) {
    return null;
  }
  
  const [, traditional, simplified, pinyin, definitions] = match;
  
  return {
    simplified: simplified.trim(),
    traditional: traditional.trim(), 
    pinyin: convertNumberedPinyinToTones(pinyin),
    pinyinRaw: pinyin,
    definitions: definitions.split('/').filter(d => d.trim()).map(d => d.trim())
  };
}

// Convertir pinyin con números (ren2) a marcas tonales (rén)
function convertNumberedPinyinToTones(numberedPinyin) {
  const toneMap = {
    'a1': 'ā', 'a2': 'á', 'a3': 'ǎ', 'a4': 'à',
    'o1': 'ō', 'o2': 'ó', 'o3': 'ǒ', 'o4': 'ò',
    'e1': 'ē', 'e2': 'é', 'e3': 'ě', 'e4': 'è',
    'i1': 'ī', 'i2': 'í', 'i3': 'ǐ', 'i4': 'ì',
    'u1': 'ū', 'u2': 'ú', 'u3': 'ǔ', 'u4': 'ù',
    'v1': 'ǖ', 'v2': 'ǘ', 'v3': 'ǚ', 'v4': 'ǜ'  // ü convertida a v
  };
  
  // Convertir u: a v para simplificar
  let processed = numberedPinyin.replace(/u:/g, 'v');
  
  // Aplicar tonos a vocales
  processed = processed.replace(/([aoeiu]v?)([1-4])/gi, (match, vowel, tone) => {
    const key = vowel.toLowerCase() + tone;
    return toneMap[key] || match;
  });
  
  // Remover números restantes
  return processed.replace(/[0-9]/g, '');
}

// Procesar CC-CEDICT y extraer datos de caracteres específicos
async function processCEDICT(targetCharacters) {
  console.log('📋 Procesando CC-CEDICT...');
  
  const characterData = {};
  const targetSet = new Set(targetCharacters);
  
  // Inicializar datos vacíos para todos los caracteres
  targetCharacters.forEach(char => {
    characterData[char] = {
      pinyin: '',
      definitions: [],
      frequency: 0,
      unicode: char.codePointAt(0)
    };
  });
  
  const content = fs.readFileSync(CEDICT_RAW_FILE, 'utf8');
  const lines = content.split('\n');
  
  console.log(`   - Total líneas en CC-CEDICT: ${lines.length}`);
  
  let processed = 0;
  let matches = 0;
  
  for (const line of lines) {
    const entry = parseCEDICTLine(line);
    if (!entry) continue;
    
    processed++;
    
    // Verificar caracteres tanto en simplificado como en tradicional
    const allChars = [...new Set([...entry.simplified, ...entry.traditional])];
    
    for (let i = 0; i < entry.simplified.length; i++) {
      const char = entry.simplified[i];
      
      if (targetSet.has(char)) {
        matches++;
        
        // Si es un carácter individual, usar su pinyin directamente (prioridad alta)
        if (entry.simplified.length === 1) {
          characterData[char] = {
            pinyin: entry.pinyin,
            definitions: entry.definitions,
            frequency: characterData[char].frequency + 1,
            unicode: char.codePointAt(0),
            traditional: entry.traditional || char
          };
        } else {
          // Para palabras multi-carácter, incrementar frecuencia
          characterData[char].frequency++;
          
          // Si aún no tiene pinyin, intentar extraerlo de palabras compuestas
          if (!characterData[char].pinyin) {
            // Segmentar pinyin por sílabas
            const syllables = entry.pinyin.split(/\s+/);
            if (syllables.length === entry.simplified.length) {
              characterData[char].pinyin = syllables[i];
            }
          }
          
          // Si aún no tiene definiciones, usar las de la palabra compuesta como contexto
          if (characterData[char].definitions.length === 0) {
            characterData[char].definitions = [`(in compound: ${entry.simplified}) ${entry.definitions[0] || ''}`];
          }
          
          // Actualizar tradicional si no existe
          if (!characterData[char].traditional && entry.traditional.length === entry.simplified.length) {
            characterData[char].traditional = entry.traditional[i];
          }
        }
      }
    }
    
    // También verificar caracteres tradicionales si difieren del simplificado
    if (entry.traditional !== entry.simplified) {
      for (let i = 0; i < entry.traditional.length; i++) {
        const traditionalChar = entry.traditional[i];
        const simplifiedChar = entry.simplified[i];
        
        // Si el carácter tradicional corresponde a un simplificado en nuestro conjunto
        if (targetSet.has(simplifiedChar) && traditionalChar !== simplifiedChar) {
          // Actualizar datos con información del tradicional
          if (characterData[simplifiedChar] && !characterData[simplifiedChar].traditional) {
            characterData[simplifiedChar].traditional = traditionalChar;
          }
        }
      }
    }
    
    // Mostrar progreso cada 10000 líneas
    if (processed % 10000 === 0) {
      console.log(`   📊 Procesadas ${processed} líneas, ${matches} coincidencias encontradas`);
    }
  }
  
  console.log(`📈 Estadísticas finales:`);
  console.log(`   - Entradas procesadas: ${processed}`);
  console.log(`   - Coincidencias totales: ${matches}`);
  
  // Contar caracteres con datos completos
  const withPinyin = targetCharacters.filter(char => characterData[char].pinyin).length;
  const withDefinitions = targetCharacters.filter(char => characterData[char].definitions.length > 0).length;
  
  console.log(`   - Caracteres con pinyin: ${withPinyin}/${targetCharacters.length}`);
  console.log(`   - Caracteres con definiciones: ${withDefinitions}/${targetCharacters.length}`);
  
  return characterData;
}

// Script principal
async function main() {
  console.log('🚀 Iniciando procesamiento de datos de caracteres chinos...\n');
  
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Verificar si necesitamos actualizar CC-CEDICT
  if (needsUpdate()) {
    console.log('🔄 CC-CEDICT necesita actualización...');
    await downloadCEDICT();
  } else {
    console.log('✅ CC-CEDICT está actualizado');
  }
  
  // Extraer caracteres únicos del diccionario
  const characters = extractUniqueChineseCharacters();
  
  if (characters.length === 0) {
    console.log('❌ No se encontraron caracteres chinos en el diccionario');
    process.exit(1);
  }
  
  // Procesar CC-CEDICT
  const characterData = await processCEDICT(characters);
  
  // Preparar datos de salida
  const outputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCharacters: characters.length,
      source: 'CC-CEDICT (Creative Commons Chinese-English Dictionary)',
      license: 'Creative Commons Attribution-Share Alike 3.0',
      attribution: 'Character data based on CC-CEDICT',
      version: '1.0'
    },
    characters: characterData
  };
  
  // Guardar datos
  fs.writeFileSync(CHARACTER_DATA_FILE, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log(`\n✅ Procesamiento completado!`);
  console.log(`📁 Datos guardados en: ${CHARACTER_DATA_FILE}`);
  console.log(`📊 Caracteres procesados: ${characters.length}`);
  
  // Mostrar algunos ejemplos
  console.log('\n📋 Ejemplos de datos extraídos:');
  const examples = characters.slice(0, 5);
  examples.forEach(char => {
    const data = characterData[char];
    console.log(`   ${char}: ${data.pinyin} (freq: ${data.frequency}) - ${data.definitions.slice(0, 2).join(', ')}`);
  });
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { downloadCEDICT, processCEDICT, convertNumberedPinyinToTones };