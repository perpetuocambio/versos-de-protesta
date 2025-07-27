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
  
  // Leer datos de radicales
  const radicalsData = JSON.parse(fs.readFileSync(RADICALS_FILE, 'utf8'));
  
  // Leer diccionario chino para obtener traducciones
  let dictionaryData = {};
  if (fs.existsSync(DICTIONARY_PATH)) {
    dictionaryData = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
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
      
      charactersByRadical[radical].push({
        character: character,
        unicode: data.unicode,
        pinyin: dictEntry?.pronunciation?.zh_pinyin || '',
        translation: dictEntry?.translations?.es || '',
        radicalType: data.radicalType,
        revolutionaryRelevance: data.revolutionaryRelevance || false,
        frequency: dictEntry?.frequency || 0
      });
    }
  });
  
  // Ordenar caracteres dentro de cada radical por frecuencia y después alfabéticamente
  Object.keys(charactersByRadical).forEach(radical => {
    charactersByRadical[radical].sort((a, b) => {
      // Primero por relevancia revolucionaria
      if (a.revolutionaryRelevance !== b.revolutionaryRelevance) {
        return b.revolutionaryRelevance - a.revolutionaryRelevance;
      }
      // Luego por frecuencia
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      // Finalmente alfabéticamente por pinyin
      return a.pinyin.localeCompare(b.pinyin);
    });
  });
  
  // Crear información completa de radicales
  const radicalsList = Object.entries(radicalsData.radicals).map(([radical, info]) => {
    const charactersWithRadical = charactersByRadical[radical] || [];
    
    return {
      radical: radical,
      number: info.number,
      strokes: info.strokes,
      meaning: info.meaning,
      category: info.category,
      frequency: charactersWithRadical.length,
      characters: charactersWithRadical
    };
  });
  
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
      version: "1.0.0",
      totalRadicals: radicalsList.length,
      totalCharacters: Object.keys(radicalsData.characters).length,
      sources: ["Kangxi Radical System", "Internal Dictionary"],
      searchCapabilities: [
        "radical_to_characters",
        "category_browsing", 
        "stroke_count_filtering",
        "revolutionary_filtering"
      ]
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
      totalCharacters: Object.keys(radicalsData.characters).length,
      revolutionaryCharacters: Object.values(radicalsData.characters)
        .filter(char => char.revolutionaryRelevance).length,
      averageCharactersPerRadical: Math.round(
        Object.keys(radicalsData.characters).length / radicalsList.length * 10
      ) / 10,
      mostFrequentRadicals: radicalsList
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
  
  console.log(`✅ Índice de radicales generado exitosamente:`);
  console.log(`   📁 Archivo: ${OUTPUT_FILE}`);
  console.log(`   📊 Radicales indexados: ${radicalsList.length}`);
  console.log(`   📚 Caracteres totales: ${Object.keys(radicalsData.characters).length}`);
  console.log(`   📂 Categorías: ${Object.keys(categoriesIndex).length}`);
  console.log(`   🚩 Caracteres revolucionarios: ${index.stats.revolutionaryCharacters}`);
  console.log(`   📈 Radicales más frecuentes:`);
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