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
const KANGXI_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'kangxi-radicals-official.json');
const SEMANTIC_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radical-semantic-categories.json');
const VARIANTS_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radical-variants.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'radical.json');

// Variables globales para datos cargados
let kangxiRadicals = null;
let semanticCategories = null;
let radicalVariants = null;

// Función para cargar datos Kangxi
async function loadKangxiData() {
  if (!kangxiRadicals) {
    const data = JSON.parse(await fs.readFile(KANGXI_PATH, 'utf8'));
    kangxiRadicals = {};
    data.radicals.forEach(radical => {
      kangxiRadicals[radical.radical] = {
        number: radical.number,
        pinyin: radical.meaning.zh_pinyin ? radical.meaning.zh_pinyin.replace(/\d/g, '') : null,
        strokes: radical.strokes
      };
    });
  }
  return kangxiRadicals;
}

// Función para cargar categorías semánticas
async function loadSemanticData() {
  if (!semanticCategories) {
    const data = JSON.parse(await fs.readFile(SEMANTIC_PATH, 'utf8'));
    semanticCategories = {};
    
    // Invertir la estructura para busqueda eficiente: radical -> categoría
    Object.entries(data.categories).forEach(([category, categoryData]) => {
      categoryData.radicals.forEach(radical => {
        semanticCategories[radical] = category;
      });
    });
  }
  return semanticCategories;
}

// Función para cargar variantes de radicales
async function loadRadicalVariants() {
  if (!radicalVariants) {
    const data = JSON.parse(await fs.readFile(VARIANTS_PATH, 'utf8'));
    radicalVariants = data.variants;
  }
  return radicalVariants;
}

// Función para obtener pinyin de un radical
function getRadicalPinyin(radical, kangxiData, radicalInfo) {
  // Prioridad: 1) Kangxi oficial, 2) datos del radical unificado, 3) unknown
  const kangxiPinyin = kangxiData[radical]?.pinyin;
  const unifiedPinyin = radicalInfo.meaning['zh-pinyin'];
  
  if (kangxiPinyin && kangxiPinyin !== 'unknown') return kangxiPinyin;
  if (unifiedPinyin && unifiedPinyin !== 'unknown') return unifiedPinyin;
  return 'unknown';
}

// Función para categorizar radicales por número de trazos
function getRadicalCategory(strokes) {
  if (strokes <= 3) return "Básicos (1-3 trazos)";
  if (strokes <= 6) return "Intermedios (4-6 trazos)";
  if (strokes <= 10) return "Complejos (7-10 trazos)";
  return "Muy complejos (11+ trazos)";
}

// Función para obtener número correcto de trazos
function getCorrectStrokes(radical, kangxiData, radicalInfo) {
  // Prioridad: 1) Kangxi oficial (más preciso), 2) datos unificados
  const kangxiStrokes = kangxiData[radical]?.strokes;
  const unifiedStrokes = radicalInfo.strokes;
  
  return kangxiStrokes || unifiedStrokes;
}

// Función para obtener categoría semántica de un radical
function getSemanticCategory(radical, semanticData) {
  return semanticData[radical] || 'otros';
}

// Función para obtener número de radical Kangxi
function getRadicalNumber(radical, kangxiData) {
  return kangxiData[radical]?.number || "N/A";
}

// Función para verificar si un radical es válido (incluye variantes)
function isValidRadical(radical, kangxiData, variantsData) {
  // 1. Verificar si es un radical estándar Kangxi
  if (kangxiData[radical]) {
    return { isValid: true, standardForm: radical, isVariant: false };
  }
  
  // 2. Verificar si es una variante de un radical Kangxi
  if (variantsData[radical]) {
    const standardForm = variantsData[radical].kangxi_standard;
    if (kangxiData[standardForm]) {
      return { isValid: true, standardForm: standardForm, isVariant: true };
    }
  }
  
  return { isValid: false, standardForm: null, isVariant: false };
}

// Función para obtener datos del radical (considerando variantes)
function getRadicalInfo(radical, kangxiData, variantsData, radicalInfo) {
  const validation = isValidRadical(radical, kangxiData, variantsData);
  
  if (!validation.isValid) {
    return null;
  }
  
  const standardForm = validation.standardForm;
  const kangxiInfo = kangxiData[standardForm];
  
  return {
    radical: radical,
    standardForm: standardForm,
    isVariant: validation.isVariant,
    kangxiNumber: kangxiInfo?.number || "N/A",
    strokes: kangxiInfo?.strokes || radicalInfo.strokes,
    pinyin: kangxiInfo?.pinyin || radicalInfo.meaning['zh-pinyin'] || 'unknown'
  };
}

async function generateRadicalDictionary() {
  console.log('🔍 Generando diccionario de radicales...');
  
  try {
    // Cargar datos de configuración
    const kangxiData = await loadKangxiData();
    const semanticData = await loadSemanticData();
    const variantsData = await loadRadicalVariants();
    
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
    // FILTRAR: Solo incluir radicales que estén en la lista oficial Kangxi (incluyendo variantes)
    for (const [radical, radicalInfo] of Object.entries(radicalsData.radicals)) {
      // Verificar si es un radical válido (estándar o variante)
      const radicalValidation = isValidRadical(radical, kangxiData, variantsData);
      
      if (!radicalValidation.isValid) {
        console.log(`⚠️ Saltando elemento no-radical: ${radical} (${radicalInfo.meaning.es})`);
        continue;
      }
      
      // Obtener información completa del radical
      const extendedRadicalInfo = getRadicalInfo(radical, kangxiData, variantsData, radicalInfo);
      
      const radicalKey = radical;
      
      // Agregar al índice por letra (primer carácter del radical)
      const firstChar = radical[0];
      if (!radicalDict.index.letters[firstChar]) {
        radicalDict.index.letters[firstChar] = [];
      }
      radicalDict.index.letters[firstChar].push(radicalKey);
      
      // Buscar traducciones oficiales de Kangxi para la forma estándar
      let officialTranslations = null;
      
      // Cargar datos Kangxi completos para obtener traducciones
      try {
        const kangxiFullData = JSON.parse(await fs.readFile(KANGXI_PATH, 'utf8'));
        const fullKangxiRadical = kangxiFullData.radicals.find(r => r.radical === extendedRadicalInfo.standardForm);
        if (fullKangxiRadical) {
          officialTranslations = fullKangxiRadical.meaning;
        }
      } catch (e) {
        console.log(`⚠️ No se pudieron cargar traducciones oficiales para ${radicalKey}`);
      }
      
      // Añadir información de variante si aplica
      const variantInfo = extendedRadicalInfo.isVariant ? variantsData[radical] : null;
      
      // Crear entrada de palabra completa
      radicalDict.words[radicalKey] = {
        translations: {
          es: officialTranslations?.es || radicalInfo.meaning.es,
          en: officialTranslations?.en || radicalInfo.meaning.en, 
          de: radicalInfo.meaning.de,  // Mantener datos unificados para idiomas no disponibles en Kangxi
          pt: radicalInfo.meaning.pt,
          ru: radicalInfo.meaning.ru,
          ruRom: radicalInfo.meaning['ru-rom'],
          zh: radicalInfo.meaning.zh,
          zhPinyin: extendedRadicalInfo.pinyin
        },
        metadata: {
          category: "radical",
          radicalCategory: getRadicalCategory(extendedRadicalInfo.strokes),
          semanticCategory: getSemanticCategory(extendedRadicalInfo.standardForm, semanticData),
          strokes: extendedRadicalInfo.strokes,
          characterCount: radicalInfo.characters ? radicalInfo.characters.length : 0,
          characters: radicalInfo.characters || [],
          radicalNumber: extendedRadicalInfo.kangxiNumber,
          isVariant: extendedRadicalInfo.isVariant,
          standardForm: extendedRadicalInfo.standardForm,
          variantType: variantInfo?.type || null
        },
        lessons: ["Radical Dictionary"],
        meaning: officialTranslations?.es || radicalInfo.meaning.es,
        pronunciation: {
          zh_pinyin: extendedRadicalInfo.pinyin
        },
        context: `Radical Kangxi #${extendedRadicalInfo.kangxiNumber}${extendedRadicalInfo.isVariant ? ` (variante ${variantInfo.type} de ${extendedRadicalInfo.standardForm})` : ''} que significa "${officialTranslations?.es || radicalInfo.meaning.es}". Aparece en ${radicalInfo.characters ? radicalInfo.characters.length : 0} caracteres: ${radicalInfo.characters ? radicalInfo.characters.join(', ') : 'ninguno'}.`,
        sources: {
          lesson: "Radical Dictionary",
          context: `Radical Kangxi #${extendedRadicalInfo.kangxiNumber} • ${extendedRadicalInfo.strokes} trazos • ${radicalInfo.characters ? radicalInfo.characters.length : 0} caracteres`
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