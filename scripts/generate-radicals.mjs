#!/usr/bin/env node

/**
 * GENERADOR DE DICCIONARIO DE RADICALES
 * ====================================
 * 
 * Lee kangxi-radicals-official.json y genera el diccionario.
 * Sin lógica compleja, sin datos hardcodeados.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const KANGXI_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'kangxi-radicals-official.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'radical.json');

// Variantes críticas (mínimo necesario)
const VARIANTS = {
  '氵': '水', '扌': '手', '亻': '人', '忄': '心', '艹': '艸', '钅': '金'
};

function cleanPinyin(pinyin) {
  return pinyin ? pinyin.replace(/\d/g, '') : 'unknown';
}

function getComplexity(strokes) {
  if (strokes <= 3) return "Básicos (1-3 trazos)";
  if (strokes <= 6) return "Intermedios (4-6 trazos)";
  if (strokes <= 10) return "Complejos (7-10 trazos)";
  return "Muy complejos (11+ trazos)";
}

async function generateRadicals() {
  console.log('🔍 Generando diccionario de radicales...');
  
  const kangxiData = JSON.parse(await fs.readFile(KANGXI_PATH, 'utf8'));
  
  const dict = {
    meta: {
      language: "🔍 Radicales Chinos",
      code: "radical",
      wordCount: 0,
      lastUpdated: new Date().toISOString(),
      generatedBy: "generate-radicals.mjs v1.0"
    },
    index: { letters: {} },
    words: {}
  };
  
  // Procesar radicales oficiales
  kangxiData.radicals.forEach(radical => {
    const char = radical.radical;
    const firstChar = char[0];
    
    if (!dict.index.letters[firstChar]) {
      dict.index.letters[firstChar] = [];
    }
    dict.index.letters[firstChar].push(char);
    
    dict.words[char] = {
      translations: {
        es: radical.meaning.es,
        en: radical.meaning.en,
        de: radical.meaning.de,
        pt: radical.meaning.pt,
        ru: radical.meaning.ru,
        ruRom: radical.meaning.ru_rom,
        zh: char,
        zhPinyin: cleanPinyin(radical.meaning.zh_pinyin)
      },
      metadata: {
        category: "radical",
        radicalCategory: getComplexity(radical.strokes),
        semanticCategory: "otros",
        strokes: radical.strokes,
        radicalNumber: radical.number,
        isVariant: false
      },
      lessons: ["Radical Dictionary"],
      meaning: radical.meaning.es,
      pronunciation: { zh_pinyin: cleanPinyin(radical.meaning.zh_pinyin) },
      context: `Radical Kangxi #${radical.number} que significa "${radical.meaning.es}". ${radical.strokes} trazos.`,
      sources: {
        lesson: "Radical Dictionary",
        context: `Radical Kangxi #${radical.number} • ${radical.strokes} trazos`
      }
    };
  });
  
  // Agregar variantes
  Object.entries(VARIANTS).forEach(([variant, standard]) => {
    const standardRadical = kangxiData.radicals.find(r => r.radical === standard);
    if (!standardRadical) return;
    
    const firstChar = variant[0];
    if (!dict.index.letters[firstChar]) {
      dict.index.letters[firstChar] = [];
    }
    dict.index.letters[firstChar].push(variant);
    
    dict.words[variant] = {
      ...dict.words[standard],
      translations: { ...dict.words[standard].translations, zh: variant },
      metadata: { ...dict.words[standard].metadata, isVariant: true, standardForm: standard },
      context: `Radical Kangxi #${standardRadical.number} (variante de ${standard}) que significa "${standardRadical.meaning.es}". ${standardRadical.strokes} trazos.`
    };
  });
  
  dict.meta.wordCount = Object.keys(dict.words).length;
  
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(dict, null, 2), 'utf8');
  
  console.log(`✅ Generado: ${dict.meta.wordCount} entradas`);
  console.log(`📁 ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateRadicals();
}

export { generateRadicals };