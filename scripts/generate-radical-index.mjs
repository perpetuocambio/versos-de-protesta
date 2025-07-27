#!/usr/bin/env node

/**
 * GENERADOR DE ÍNDICE DE BÚSQUEDA POR RADICALES
 * =============================================
 * 
 * Crea un índice optimizado para buscar caracteres por radical,
 * permitiendo búsqueda inversa: radical → caracteres que lo contienen
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const RADICALS_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radicals.json');
const OFFICIAL_RADICALS_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'kangxi-radicals-official.json');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'zh.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radical-index.json');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

async function generateRadicalIndex() {
  console.log('🔍 Generando índice de búsqueda por radicales...');
  
  // Crear directorio si no existe
  const outputDir = path.dirname(OUTPUT_FILE);
  ensureDirectoryExists(outputDir);
  
  // Leer datos oficiales de radicales Kangxi (todos los 214)
  let officialRadicalsData = {};
  if (fs.existsSync(OFFICIAL_RADICALS_FILE)) {
    officialRadicalsData = JSON.parse(fs.readFileSync(OFFICIAL_RADICALS_FILE, 'utf8'));
    console.log(`📚 Cargados ${officialRadicalsData.radicals?.length || 0} radicales oficiales Kangxi`);
  }
  
  // Leer datos de radicales con caracteres asociados (para backward compatibility)
  let radicalsData = { characters: {}, radicals: {} };
  if (fs.existsSync(RADICALS_FILE)) {
    radicalsData = JSON.parse(fs.readFileSync(RADICALS_FILE, 'utf8'));
    console.log(`📝 Cargados ${Object.keys(radicalsData.characters || {}).length} caracteres con radicales asignados`);
  }
  
  // Leer diccionario chino para obtener traducciones
  let dictionaryData = {};
  if (fs.existsSync(DICTIONARY_PATH)) {
    dictionaryData = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
    console.log(`📖 Cargadas ${Object.keys(dictionaryData.words || {}).length} palabras del diccionario chino`);
  }
  
  // Crear índice: radical → lista de caracteres
  const radicalIndex = {};
  const charactersByRadical = {};
  
  // Procesar caracteres
  Object.entries(radicalsData.characters).forEach(([character, data]) => {
    const radical = data.radical;
    
    if (radical && radical !== "未知") {
      if (!charactersByRadical[radical]) {
        charactersByRadical[radical] = [];
      }
      
      // Obtener información del diccionario si está disponible
      const dictEntry = dictionaryData.words?.[character];
      let pinyin = '';
      let translation = '';
      let frequency = 0;
      let lessons = [];
      
      if (dictEntry) {
        // Encontrado el carácter individual
        pinyin = dictEntry.pronunciation?.zh_pinyin || dictEntry.entries?.[0]?.allTranslations?.zhPinyin || '';
        translation = dictEntry.translations?.es || dictEntry.entries?.[0]?.allTranslations?.es || '';
        frequency = dictEntry.frequency || 0;
        lessons = dictEntry.lessons || [];
      } else {
        // Buscar palabras que empiecen con este carácter
        const wordsWithChar = Object.entries(dictionaryData.words || {})
          .filter(([word, data]) => word.startsWith(character))
          .sort((a, b) => (b[1].frequency || 0) - (a[1].frequency || 0));
        
        if (wordsWithChar.length > 0) {
          const [firstWord, firstData] = wordsWithChar[0];
          // Extraer pinyin del primer carácter
          const pinyinFull = firstData.pronunciation?.zh_pinyin || firstData.entries?.[0]?.allTranslations?.zhPinyin || '';
          pinyin = pinyinFull.split(' ')[0] || '';
          translation = `${firstData.translations?.es || firstData.entries?.[0]?.allTranslations?.es || ''} (en "${firstWord}")`;
          frequency = firstData.frequency || 0;
          lessons = firstData.lessons || [];
        }
      }
      
      charactersByRadical[radical].push({
        character: character,
        unicode: data.unicode,
        pinyin: pinyin,
        translation: translation,
        radicalType: data.radicalType,
        frequency: frequency,
        lessons: lessons
      });
    }
  });
  
  // Ordenar caracteres dentro de cada radical por frecuencia y después alfabéticamente
  Object.keys(charactersByRadical).forEach(radical => {
    charactersByRadical[radical].sort((a, b) => {
      // Primero por frecuencia
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      // Finalmente alfabéticamente por pinyin
      return a.pinyin.localeCompare(b.pinyin);
    });
  });
  
  // Crear información completa de radicales usando los 214 oficiales
  const radicalsList = [];
  
  // Usar radicales oficiales como base (todos los 214)
  if (officialRadicalsData.radicals) {
    officialRadicalsData.radicals.forEach(radicalInfo => {
      const radical = radicalInfo.radical;
      const charactersWithRadical = charactersByRadical[radical] || [];
      
      radicalsList.push({
        radical: radical,
        number: radicalInfo.number,
        strokes: radicalInfo.strokes,
        meaning: {
          es: radicalInfo.meaning.es,
          en: radicalInfo.meaning.en,
          zh_pinyin: radicalInfo.meaning.zh_pinyin || radical
        },
        category: radicalInfo.category,
        frequency: charactersWithRadical.length,
        characters: charactersWithRadical,
        sources: radicalInfo.sources || ['Kangxi Standard'],
        unicode: radicalInfo.unicode,
        metadata: radicalInfo.metadata || {}
      });
    });
    
    console.log(`✅ Procesados ${radicalsList.length} radicales oficiales Kangxi`);
  } else {
    // Fallback a datos anteriores si no están disponibles los oficiales
    console.log('⚠️ Datos oficiales no disponibles, usando datos legacy...');
    
    Object.entries(radicalsData.radicals).forEach(([radical, info]) => {
      const charactersWithRadical = charactersByRadical[radical] || [];
      
      radicalsList.push({
        radical: radical,
        number: info.number,
        strokes: info.strokes,
        meaning: info.meaning,
        category: info.category,
        frequency: charactersWithRadical.length,
        characters: charactersWithRadical
      });
    });
  }
  
  // Ordenar radicales por frecuencia de uso y luego por número Kangxi
  radicalsList.sort((a, b) => {
    if (a.frequency !== b.frequency) {
      return b.frequency - a.frequency;
    }
    return a.number - b.number;
  });
  
  // Crear categorías de radicales
  const categoriesIndex = {};
  radicalsList.forEach(radicalInfo => {
    const category = radicalInfo.category;
    if (!categoriesIndex[category]) {
      categoriesIndex[category] = [];
    }
    categoriesIndex[category].push({
      radical: radicalInfo.radical,
      meaning: radicalInfo.meaning,
      frequency: radicalInfo.frequency,
      strokes: radicalInfo.strokes
    });
  });
  
  // Crear índice final
  const index = {
    metadata: {
      generated: new Date().toISOString(),
      version: "2.0.0",
      description: "Complete Kangxi radical index with all 214 official radicals",
      totalRadicals: radicalsList.length,
      totalCharacters: Object.keys(radicalsData.characters || {}).length,
      officialsource: officialRadicalsData.metadata || null,
      sources: [
        "Unicode Standard (official Kangxi radicals)",
        "CC-CEDICT (pronunciation and definitions)", 
        "Internal Dictionary (character associations)"
      ],
      searchCapabilities: [
        "radical_to_characters",
        "category_browsing", 
        "stroke_count_filtering",
        "all_214_kangxi_radicals",
        "vocabulary_word_association"
      ],
      coverage: {
        kangxi_radicals: radicalsList.length,
        radicals_with_characters: radicalsList.filter(r => r.frequency > 0).length,
        empty_radicals: radicalsList.filter(r => r.frequency === 0).length
      }
    },
    
    // Índice principal: radical → caracteres
    radicals: radicalsList,
    
    // Índice por categorías
    categories: categoriesIndex,
    
    // Índice por número de trazos
    strokesIndex: {},
    
    // Estadísticas
    stats: {
      totalRadicals: radicalsList.length,
      totalCharacters: Object.keys(radicalsData.characters || {}).length,
      vocabularyWords: Object.keys(dictionaryData.words || {}).length,
      averageCharactersPerRadical: Math.round(
        Object.keys(radicalsData.characters || {}).length / radicalsList.length * 10
      ) / 10,
      mostFrequentRadicals: radicalsList
        .filter(r => r.frequency > 0)
        .slice(0, 10)
        .map(r => ({ radical: r.radical, frequency: r.frequency, meaning: r.meaning.es }))
    }
  };
  
  // Crear índice por número de trazos
  radicalsList.forEach(radicalInfo => {
    const strokes = radicalInfo.strokes;
    if (!index.strokesIndex[strokes]) {
      index.strokesIndex[strokes] = [];
    }
    index.strokesIndex[strokes].push({
      radical: radicalInfo.radical,
      meaning: radicalInfo.meaning,
      frequency: radicalInfo.frequency,
      category: radicalInfo.category
    });
  });
  
  // Escribir archivo
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf8');
  
  console.log(`✅ Índice completo de radicales Kangxi generado exitosamente:`);
  console.log(`   📁 Archivo: ${OUTPUT_FILE}`);
  console.log(`   📊 Total radicales Kangxi: ${radicalsList.length}/214`);
  console.log(`   📚 Caracteres asociados: ${Object.keys(radicalsData.characters || {}).length}`);
  console.log(`   📖 Palabras de vocabulario: ${index.stats.vocabularyWords}`);
  console.log(`   📂 Categorías: ${Object.keys(categoriesIndex).length}`);
  console.log(`   📈 Cobertura:`);
  console.log(`      ✅ Radicales con caracteres: ${index.metadata.coverage.radicals_with_characters}`);
  console.log(`      📭 Radicales sin caracteres: ${index.metadata.coverage.empty_radicals}`);
  console.log(`   🎯 Radicales más frecuentes:`);
  index.stats.mostFrequentRadicals.slice(0, 5).forEach(r => {
    console.log(`      ${r.radical} (${r.meaning}) - ${r.frequency} caracteres`);
  });
  
  return index;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRadicalIndex().catch(console.error);
}

export { generateRadicalIndex };