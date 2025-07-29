#!/usr/bin/env node

/**
 * GENERADOR DE DICCIONARIO DE RADICALES
 * ====================================
 * 
 * Genera radical.json para el frontend usando datos ya consolidados:
 * - radicals-unified.json (radicales con caracteres)  
 * - character-radical-unified.json (datos detallados de caracteres)
 * 
 * Output: /internal/v1/dictionary/languages/radical.json
 * Compatible con DynamicDictionary.astro
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const RADICALS_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radicals-unified.json');
const CHARACTERS_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'character-radical-unified.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'radical.json');

async function generateRadicalDictionary() {
  console.log('🔍 Generando diccionario de radicales...');
  
  try {
    // Leer datos existentes
    const radicalsData = JSON.parse(await fs.readFile(RADICALS_PATH, 'utf8'));
    const charactersData = JSON.parse(await fs.readFile(CHARACTERS_PATH, 'utf8'));
    
    const radicalDict = {
      meta: {
        language: "🔍 Radicales Chinos",
        code: "radical", 
        wordCount: Object.keys(radicalsData.radicals).length,
        lastUpdated: new Date().toISOString(),
        generatedBy: "generate-radical-dictionary.mjs v1.0"
      },
      index: {
        letters: {}
      },
      words: {}
    };
    
    // Para cada radical, crear entradas en el formato esperado
    for (const [radical, radicalInfo] of Object.entries(radicalsData.radicals)) {
      const radicalKey = radical;
      
      // Agregar al índice por letra (primer carácter del radical)
      const firstChar = radical[0];
      if (!radicalDict.index.letters[firstChar]) {
        radicalDict.index.letters[firstChar] = [];
      }
      radicalDict.index.letters[firstChar].push(radicalKey);
      
      // Crear entrada de palabra completa
      radicalDict.words[radicalKey] = {
        translations: {
          es: radicalInfo.meaning.es,
          en: radicalInfo.meaning.en, 
          de: radicalInfo.meaning.de,
          pt: radicalInfo.meaning.pt,
          ru: radicalInfo.meaning.ru,
          ruRom: radicalInfo.meaning['ru-rom'],
          zh: radicalInfo.meaning.zh,
          zhPinyin: radicalInfo.meaning['zh-pinyin']
        },
        metadata: {
          category: "radical",
          strokes: radicalInfo.strokes,
          characterCount: radicalInfo.characters ? radicalInfo.characters.length : 0,
          characters: radicalInfo.characters || []
        },
        lessons: ["Radical Dictionary"],
        meaning: radicalInfo.meaning.es,
        pronunciation: {
          zh_pinyin: radicalInfo.meaning['zh-pinyin'] || radicalInfo.radical
        },
        context: `Radical Kangxi que significa "${radicalInfo.meaning.es}". Aparece en ${radicalInfo.characters ? radicalInfo.characters.length : 0} caracteres: ${radicalInfo.characters ? radicalInfo.characters.join(', ') : 'ninguno'}.`,
        sources: {
          lesson: "Radical Dictionary",
          context: `Radical Kangxi • ${radicalInfo.strokes} trazos • ${radicalInfo.characters ? radicalInfo.characters.length : 0} caracteres`
        }
      };
      
      // Para cada carácter del radical, agregar datos detallados si existen
      if (radicalInfo.characters) {
        for (const char of radicalInfo.characters) {
          if (charactersData.characters[char]) {
            const charData = charactersData.characters[char];
            
            // Agregar carácter como entrada separada
            const charKey = `${char} (${radical})`;
            
            if (!radicalDict.index.letters[firstChar]) {
              radicalDict.index.letters[firstChar] = [];
            }
            if (!radicalDict.index.letters[firstChar].includes(charKey)) {
              radicalDict.index.letters[firstChar].push(charKey);
            }
            
            radicalDict.words[charKey] = {
              translations: {
                es: charData.translations?.es || char,
                en: charData.translations?.en || char,
                de: charData.translations?.de || char,
                pt: charData.translations?.pt || char,
                ru: charData.translations?.ru || char,
                ruRom: charData.translations?.ruRom || char,
                zh: char,
                zhPinyin: charData.pinyin || "unknown"
              },
              metadata: {
                category: "character",
                radical: radical,
                strokes: charData.strokes,
                unicode: charData.unicode,
                structure: charData.structure,
                hasStrokeData: charData.hasStrokeData || false
              },
              lessons: charData.sources?.found_in_articles || ["Dictionary"],
              meaning: charData.translations?.es || `Carácter del radical ${radicalInfo.meaning.es}`,
              pronunciation: {
                zh_pinyin: charData.pinyin || "unknown"
              },
              context: `Carácter que usa el radical ${radical} (${radicalInfo.meaning.es}). Pinyin: ${charData.pinyin || 'desconocido'}. ${charData.strokes} trazos.`,
              sources: {
                lesson: charData.sources?.found_in_articles?.join(', ') || "Dictionary",
                context: `Del radical ${radical} • ${charData.strokes} trazos • ${charData.structure || 'estructura desconocida'}`
              }
            };
          }
        }
      }
    }
    
    // Escribir archivo
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(radicalDict, null, 2), 'utf8');
    
    console.log(`✅ Diccionario de radicales generado: ${Object.keys(radicalDict.words).length} entradas`);
    console.log(`📁 Archivo: ${OUTPUT_PATH}`);
    
    return radicalDict;
    
  } catch (error) {
    console.error('❌ Error generando diccionario de radicales:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRadicalDictionary();
}

export { generateRadicalDictionary };