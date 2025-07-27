#!/usr/bin/env node

/**
 * DESCARGA DATOS INDIVIDUALES DE CARACTERES CHINOS DESDE MDBG
 * ============================================================
 * 
 * Fuente: MDBG Chinese Dictionary (mdbg.net)
 * Licencia: Uso educativo con atribución
 * Attribution: "Character data © MDBG Chinese Dictionary (mdbg.net)"
 * 
 * Este script descarga para cada carácter chino del diccionario:
 * - Pinyin individual
 * - Número de trazos
 * - Radical principal
 * - Significado del radical
 * - Definición básica
 * 
 * TODO: Para uso local sin dependencias en runtime
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'zh.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese');
const CHARACTER_DATA_FILE = path.join(OUTPUT_DIR, 'character-data.json');

// MDBG URLs para diferentes tipos de datos
const MDBG_DICT_URL = 'https://www.mdbg.net/chinese/dictionary';
const MDBG_API_BASE = 'https://www.mdbg.net/chinese/dictionary-ajax';

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

// Función para simular delay entre requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Descargar datos de un carácter individual desde MDBG
async function fetchCharacterDataFromMDBG(character, retries = 3) {
  try {
    const unicodeDecimal = character.codePointAt(0);
    const unicodeHex = unicodeDecimal.toString(16).toUpperCase();
    
    // MDBG usa diferentes endpoints. Probamos varios enfoques:
    
    // Enfoque 1: Búsqueda directa por carácter
    const searchUrl = `${MDBG_DICT_URL}?page=worddict&wdrst=0&wdqb=${encodeURIComponent(character)}`;
    console.log(`🔍 Buscando datos para ${character} (U+${unicodeHex})...`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Educational Chinese Dictionary Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parsear datos del HTML de respuesta de MDBG
    const characterData = parseCharacterDataFromHTML(character, html);
    
    if (characterData) {
      console.log(`   ✅ ${character}: ${characterData.pinyin} (${characterData.strokes} trazos, radical: ${characterData.radical})`);
      return characterData;
    } else {
      console.log(`   ⚠️ ${character}: No se encontraron datos`);
      return {
        pinyin: '',
        radical: '',
        strokes: null,
        meaning: '',
        unicode: unicodeDecimal
      };
    }
    
  } catch (error) {
    console.error(`   ❌ Error descargando ${character}: ${error.message}`);
    
    if (retries > 0) {
      console.log(`   🔄 Reintentando... (${retries} intentos restantes)`);
      await delay(2000); // Esperar 2 segundos antes de reintentar
      return fetchCharacterDataFromMDBG(character, retries - 1);
    }
    
    return {
      pinyin: '',
      radical: '',
      strokes: null,
      meaning: '',
      unicode: character.codePointAt(0),
      error: error.message
    };
  }
}

// Parsear datos del HTML de MDBG
function parseCharacterDataFromHTML(character, html) {
  try {
    // MDBG estructura típica de resultados
    
    // Buscar pinyin (típicamente en formato como [wu2] o similar)
    const pinyinMatch = html.match(new RegExp(`${character}[\\s\\S]*?\\[(.*?)\\]`));
    let pinyin = '';
    if (pinyinMatch) {
      // Convertir números tonales a marcas diacríticas
      pinyin = convertNumberedPinyinToTones(pinyinMatch[1].trim());
    }
    
    // Buscar información de trazos
    const strokesMatch = html.match(/strokes?[\\s:]*([0-9]+)/i);
    const strokes = strokesMatch ? parseInt(strokesMatch[1]) : null;
    
    // Buscar radical (típicamente mencionado como "radical X" o similar)
    const radicalMatch = html.match(/radical[\\s:]*([^\\s]+)/i);
    const radical = radicalMatch ? radicalMatch[1].trim() : '';
    
    // Buscar definición básica (primera línea después del pinyin)
    const meaningMatch = html.match(new RegExp(`\\[${pinyinMatch?.[1] || '.*?'}\\][\\s]*([^<]*)`));
    const meaning = meaningMatch ? meaningMatch[1].trim().substring(0, 100) : '';
    
    if (pinyin || strokes || radical) {
      return {
        pinyin: pinyin,
        radical: radical,
        strokes: strokes,
        meaning: meaning,
        unicode: character.codePointAt(0)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error parseando datos para ${character}:`, error.message);
    return null;
  }
}

// Convertir pinyin con números (wu2) a marcas tonales (wú)
function convertNumberedPinyinToTones(numberedPinyin) {
  const toneMap = {
    'a1': 'ā', 'a2': 'á', 'a3': 'ǎ', 'a4': 'à',
    'o1': 'ō', 'o2': 'ó', 'o3': 'ǒ', 'o4': 'ò',
    'e1': 'ē', 'e2': 'é', 'e3': 'ě', 'e4': 'è',
    'i1': 'ī', 'i2': 'í', 'i3': 'ǐ', 'i4': 'ì',
    'u1': 'ū', 'u2': 'ú', 'u3': 'ǔ', 'u4': 'ù',
    'ü1': 'ǖ', 'ü2': 'ǘ', 'ü3': 'ǚ', 'ü4': 'ǜ'
  };
  
  // Convertir wu2 -> wú, etc.
  return numberedPinyin.replace(/([aoeiu]ü?)([1-4])/gi, (match, vowel, tone) => {
    const key = vowel.toLowerCase() + tone;
    return toneMap[key] || match;
  }).replace(/[0-9]/g, ''); // Remover números restantes
}

// Script principal
async function main() {
  console.log('🚀 Iniciando descarga de datos de caracteres chinos desde MDBG...\n');
  
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Extraer caracteres únicos del diccionario
  const characters = extractUniqueChineseCharacters();
  
  if (characters.length === 0) {
    console.log('❌ No se encontraron caracteres chinos en el diccionario');
    process.exit(1);
  }
  
  console.log(`\n📥 Descargando datos para ${characters.length} caracteres únicos...\n`);
  
  const characterData = {};
  let processed = 0;
  let successful = 0;
  
  for (const character of characters) {
    const data = await fetchCharacterDataFromMDBG(character);
    characterData[character] = data;
    
    if (data.pinyin || data.strokes) {
      successful++;
    }
    
    processed++;
    
    // Mostrar progreso cada 10 caracteres
    if (processed % 10 === 0) {
      console.log(`📊 Progreso: ${processed}/${characters.length} (${successful} exitosos)`);
    }
    
    // Delay para no sobrecargar MDBG
    await delay(1000); // 1 segundo entre requests
  }
  
  // Guardar datos
  const outputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCharacters: characters.length,
      successfulDownloads: successful,
      source: 'MDBG Chinese Dictionary (mdbg.net)',
      attribution: 'Character data © MDBG Chinese Dictionary (mdbg.net)'
    },
    characters: characterData
  };
  
  fs.writeFileSync(CHARACTER_DATA_FILE, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log(`\n✅ Descarga completada!`);
  console.log(`📁 Datos guardados en: ${CHARACTER_DATA_FILE}`);
  console.log(`📊 Estadísticas finales:`);
  console.log(`   - Total caracteres: ${characters.length}`);
  console.log(`   - Descargas exitosas: ${successful}`);
  console.log(`   - Tasa de éxito: ${(successful/characters.length*100).toFixed(1)}%`);
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fetchCharacterDataFromMDBG, convertNumberedPinyinToTones };