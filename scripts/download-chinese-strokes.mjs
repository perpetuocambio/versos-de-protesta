#!/usr/bin/env node

/**
 * DESCARGA LOCAL DE TRAZOS CHINOS
 * ===============================
 * 
 * Fuente: MDBG Chinese Dictionary (mdbg.net)
 * Licencia: Uso educativo con atribución
 * Attribution: "Stroke order animations © MDBG Chinese Dictionary (mdbg.net)"
 * 
 * Este script descarga trazos de caracteres chinos encontrados en el diccionario
 * para uso local sin dependencias externas durante la navegación.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'zh.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'strokes');
const METADATA_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'strokes-metadata.json');
const CHARACTER_DATA_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'character-data.json');

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
  
  // Buscar en la estructura anidada del diccionario
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
  
  // También buscar en el diccionario principal si existe
  if (dictionaryData.dictionary) {
    for (const [chineseWord, data] of Object.entries(dictionaryData.dictionary)) {
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
  
  console.log(`📊 Estadísticas:`);
  console.log(`   - Palabras procesadas: ${wordCount}`);
  console.log(`   - Caracteres únicos encontrados: ${uniqueChars.size}`);
  
  return Array.from(uniqueChars).sort();
}

// Descargar un archivo de trazo individual
async function downloadStrokeGif(character, retries = 3) {
  const unicodeDecimal = character.codePointAt(0);
  const gifUrl = `https://www.mdbg.net/chinese/rsc/img/stroke_anim/${unicodeDecimal}.gif`;
  const svgUrl = `https://www.mdbg.net/chinese/rsc/img/hw-char-background.svg`; // Common SVG fallback
  const gifFilename = `${unicodeDecimal}.gif`;
  const svgFilename = `${unicodeDecimal}.svg`;
  const gifFilepath = path.join(OUTPUT_DIR, gifFilename);
  const svgFilepath = path.join(OUTPUT_DIR, svgFilename);

  // Check if GIF already exists
  if (fs.existsSync(gifFilepath)) {
    return { success: true, cached: true, char: character, file: gifFilename };
  }
  // Check if SVG already exists
  if (fs.existsSync(svgFilepath)) {
    return { success: true, cached: true, char: character, file: svgFilename };
  }

  try {
    console.log(`⬇️  Descargando: ${character} (${unicodeDecimal})`);
    let response;
    let filepathToSave;
    let filenameToSave;

    // Try GIF first
    try {
      response = await fetch(gifUrl);
      if (response.ok) {
        filepathToSave = gifFilepath;
        filenameToSave = gifFilename;
      } else if (response.status === 404) {
        // If GIF not found, try SVG
        console.log(`   ℹ️ GIF no encontrado para ${character}, intentando SVG...`);
        response = await fetch(svgUrl);
        if (response.ok) {
          filepathToSave = svgFilepath;
          filenameToSave = svgFilename;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText} for SVG`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for GIF`);
      }
    } catch (gifError) {
      // If GIF fetch fails for other reasons, try SVG
      console.log(`   ⚠️ Error GIF para ${character}: ${gifError.message}, intentando SVG...`);
      response = await fetch(svgUrl);
      if (response.ok) {
        filepathToSave = svgFilepath;
        filenameToSave = svgFilename;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for SVG`);
      }
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepathToSave, Buffer.from(buffer));

    // Pequeña pausa para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      cached: false,
      char: character,
      file: filenameToSave,
      size: buffer.byteLength
    };

  } catch (error) {
    console.error(`❌ Error descargando ${character}: ${error.message}`);

    if (retries > 0) {
      console.log(`🔄 Reintentando... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await downloadStrokeGif(character, retries - 1);
    }

    return {
      success: false,
      char: character,
      error: error.message
    };
  }
}

// Obtener datos de un caracter
async function getCharacterData(character) {
  const url = `https://www.mdbg.net/chinese/dictionary-ajax?c=cdq&i=${encodeURIComponent(character)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const pinyinMatch = text.match(/<span class="pinyin">([^<]+)<\/span>/);
    const radicalMatch = text.match(/Radical: <a[^>]+>([^<]+)<\/a>/);
    const strokesMatch = text.match(/Strokes: <span class="strokes">(\d+)<\/span>/);
    const structureMatch = text.match(/Ideographic description: ([^<]+)/);

    return {
      pinyin: pinyinMatch ? pinyinMatch[1] : '',
      radical: radicalMatch ? radicalMatch[1] : '',
      strokes: strokesMatch ? parseInt(strokesMatch[1], 10) : null,
      structure: structureMatch ? structureMatch[1].trim() : null
    };
  } catch (error) {
    console.error(`❌ Error obteniendo datos para ${character}: ${error.message}`);
    return null;
  }
}

// Función principal de descarga
async function downloadAllStrokes() {
  console.log('🚀 Iniciando descarga de trazos chinos...\n');
  
  // Preparar directorios
  ensureDirectoryExists(path.join(PROJECT_ROOT, 'public', 'data', 'chinese'));
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Extraer caracteres del diccionario
  const characters = extractUniqueChineseCharacters();
  
  console.log(`\n🎯 Iniciando descarga de ${characters.length} caracteres únicos...\n`);
  
  const results = {
    total: characters.length,
    successful: 0,
    cached: 0,
    failed: 0,
    errors: [],
    totalSize: 0,
    startTime: new Date(),
    attribution: {
      source: "MDBG Chinese Dictionary",
      url: "https://www.mdbg.net/",
      license: "Educational use with attribution",
      attribution_text: "Stroke order animations © MDBG Chinese Dictionary (mdbg.net)"
    }
  };
  
  // Cargar datos de caracteres existentes
  let characterData = {};
  if (fs.existsSync(CHARACTER_DATA_FILE)) {
    characterData = JSON.parse(fs.readFileSync(CHARACTER_DATA_FILE, 'utf8'));
  }

  // Procesar en lotes para no sobrecargar
  const BATCH_SIZE = 10;
  for (let i = 0; i < characters.length; i += BATCH_SIZE) {
    const batch = characters.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (char) => {
      const gifResult = await downloadStrokeGif(char);
      if (gifResult.success && !gifResult.cached) {
        const data = await getCharacterData(char);
        if (data) {
          characterData[char] = data;
        }
      }
      return gifResult;
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result.success) {
        if (result.cached) {
          results.cached++;
        } else {
          results.successful++;
          results.totalSize += result.size || 0;
        }
      } else {
        results.failed++;
        results.errors.push({
          character: result.char,
          error: result.error
        });
      }
    }
    
    // Progreso cada lote
    const processed = Math.min(i + BATCH_SIZE, characters.length);
    const percentage = ((processed / characters.length) * 100).toFixed(1);
    console.log(`📊 Progreso: ${processed}/${characters.length} (${percentage}%) - Exitosos: ${results.successful + results.cached}, Fallidos: ${results.failed}`);
  }
  
  results.endTime = new Date();
  results.duration = results.endTime - results.startTime;
  
  // Guardar metadatos y datos de caracteres
  fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2), 'utf8');
  fs.writeFileSync(CHARACTER_DATA_FILE, JSON.stringify(characterData, null, 2), 'utf8');
  
  // Resumen final
  console.log(`\n✅ DESCARGA COMPLETADA`);
  console.log(`========================`);
  console.log(`Total caracteres: ${results.total}`);
  console.log(`✅ Exitosos: ${results.successful}`);
  console.log(`📁 En caché: ${results.cached}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`📊 Tamaño total: ${(results.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duración: ${(results.duration / 1000).toFixed(2)} segundos`);
  
  if (results.failed > 0) {
    console.log(`\n⚠️  ERRORES ENCONTRADOS:`);
    results.errors.forEach(error => {
      console.log(`   ${error.character}: ${error.error}`);
    });
  }
  
  console.log(`\n📋 ATRIBUCIÓN REQUERIDA:`);
  console.log(`   ${results.attribution.attribution_text}`);
  console.log(`   Fuente: ${results.attribution.url}`);
  
  // Crear archivo de atribución
  const attributionFile = path.join(OUTPUT_DIR, 'ATTRIBUTION.txt');
  fs.writeFileSync(attributionFile, 
    `STROKE ORDER ANIMATIONS ATTRIBUTION
=====================================

Source: MDBG Chinese Dictionary
URL: https://www.mdbg.net/
License: Educational use with attribution

Required Attribution Text:
"${results.attribution.attribution_text}"

Downloaded: ${results.endTime.toISOString()}
Total files: ${results.successful + results.cached}
Purpose: Educational use in Versos de Protesta language learning platform

This attribution file must be preserved and referenced in any implementation
using these stroke order animations.
`, 'utf8');
  
  console.log(`\n📄 Archivo de atribución creado: ${attributionFile}`);
  
  return results;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAllStrokes()
    .then((results) => {
      if (results.failed === 0) {
        console.log('🎉 ¡Descarga completada con éxito!');
      } else {
        console.log('⚠️  Descarga completada con algunos errores.');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { downloadAllStrokes, extractUniqueChineseCharacters };