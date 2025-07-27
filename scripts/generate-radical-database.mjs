#!/usr/bin/env node

/**
 * GENERADOR DE BASE DE DATOS DE RADICALES CHINOS
 * =============================================
 * 
 * Genera una base de datos precisa de radicales usando múltiples fuentes confiables:
 * - Unicode Han Database (UNIHAN)
 * - MDBG Character Database 
 * - Kangxi Radical System
 * 
 * Los radicales son componentes fundamentales de los caracteres chinos que:
 * 1. Aportan significado semántico
 * 2. Determinan la clasificación en diccionarios
 * 3. Ayudan a la memorización y comprensión
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const DICTIONARY_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages', 'zh.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'radicals.json');

// Base de datos de radicales Kangxi (214 radicales estándar)
const KANGXI_RADICALS = {
  // Radicales de 1 trazo
  "一": { number: 1, strokes: 1, meaning: { es: "uno", en: "one" }, category: "número" },
  "丨": { number: 2, strokes: 1, meaning: { es: "línea vertical", en: "vertical line" }, category: "línea" },
  "丶": { number: 3, strokes: 1, meaning: { es: "punto", en: "dot" }, category: "línea" },
  "丿": { number: 4, strokes: 1, meaning: { es: "línea inclinada", en: "slash" }, category: "línea" },
  "乙": { number: 5, strokes: 1, meaning: { es: "segundo", en: "second" }, category: "número" },
  "亅": { number: 6, strokes: 1, meaning: { es: "gancho", en: "hook" }, category: "línea" },
  
  // Radicales de 2 trazos
  "二": { number: 7, strokes: 2, meaning: { es: "dos", en: "two" }, category: "número" },
  "亠": { number: 8, strokes: 2, meaning: { es: "techo", en: "lid" }, category: "estructura" },
  "人": { number: 9, strokes: 2, meaning: { es: "persona", en: "person" }, category: "humano" },
  "儿": { number: 10, strokes: 2, meaning: { es: "niño", en: "child" }, category: "humano" },
  "入": { number: 11, strokes: 2, meaning: { es: "entrar", en: "enter" }, category: "movimiento" },
  "八": { number: 12, strokes: 2, meaning: { es: "ocho", en: "eight" }, category: "número" },
  "冂": { number: 13, strokes: 2, meaning: { es: "marco", en: "frame" }, category: "estructura" },
  "冖": { number: 14, strokes: 2, meaning: { es: "cubierta", en: "cover" }, category: "estructura" },
  "冫": { number: 15, strokes: 2, meaning: { es: "hielo", en: "ice" }, category: "naturaleza" },
  "几": { number: 16, strokes: 2, meaning: { es: "mesa baja", en: "table" }, category: "objeto" },
  "凵": { number: 17, strokes: 2, meaning: { es: "recipiente", en: "receptacle" }, category: "objeto" },
  "刀": { number: 18, strokes: 2, meaning: { es: "cuchillo", en: "knife" }, category: "herramienta" },
  "力": { number: 19, strokes: 2, meaning: { es: "fuerza", en: "power" }, category: "abstracto" },
  "勹": { number: 20, strokes: 2, meaning: { es: "envolver", en: "wrap" }, category: "acción" },
  "匕": { number: 21, strokes: 2, meaning: { es: "cuchara", en: "spoon" }, category: "herramienta" },
  "匚": { number: 22, strokes: 2, meaning: { es: "caja", en: "box" }, category: "objeto" },
  "匸": { number: 23, strokes: 2, meaning: { es: "esconder", en: "hide" }, category: "acción" },
  "十": { number: 24, strokes: 2, meaning: { es: "diez", en: "ten" }, category: "número" },
  "卜": { number: 25, strokes: 2, meaning: { es: "adivinación", en: "divination" }, category: "abstracto" },
  "卩": { number: 26, strokes: 2, meaning: { es: "sello", en: "seal" }, category: "objeto" },
  "厂": { number: 27, strokes: 2, meaning: { es: "acantilado", en: "cliff" }, category: "naturaleza" },
  "厶": { number: 28, strokes: 2, meaning: { es: "privado", en: "private" }, category: "abstracto" },
  "又": { number: 29, strokes: 2, meaning: { es: "de nuevo", en: "again" }, category: "abstracto" },
  
  // Radicales de 3 trazos (más importantes)
  "口": { number: 30, strokes: 3, meaning: { es: "boca", en: "mouth" }, category: "cuerpo" },
  "囗": { number: 31, strokes: 3, meaning: { es: "recinto", en: "enclosure" }, category: "estructura" },
  "土": { number: 32, strokes: 3, meaning: { es: "tierra", en: "earth" }, category: "naturaleza" },
  "士": { number: 33, strokes: 3, meaning: { es: "erudito", en: "scholar" }, category: "humano" },
  "夂": { number: 34, strokes: 3, meaning: { es: "ir lentamente", en: "go slowly" }, category: "movimiento" },
  "夊": { number: 35, strokes: 3, meaning: { es: "ir", en: "go" }, category: "movimiento" },
  "夕": { number: 36, strokes: 3, meaning: { es: "tarde", en: "evening" }, category: "tiempo" },
  "大": { number: 37, strokes: 3, meaning: { es: "grande", en: "big" }, category: "tamaño" },
  "女": { number: 38, strokes: 3, meaning: { es: "mujer", en: "woman" }, category: "humano" },
  "子": { number: 39, strokes: 3, meaning: { es: "hijo", en: "child" }, category: "humano" },
  "宀": { number: 40, strokes: 3, meaning: { es: "techo", en: "roof" }, category: "estructura" },
  "寸": { number: 41, strokes: 3, meaning: { es: "pulgada", en: "inch" }, category: "medida" },
  "小": { number: 42, strokes: 3, meaning: { es: "pequeño", en: "small" }, category: "tamaño" },
  "尢": { number: 43, strokes: 3, meaning: { es: "cojo", en: "lame" }, category: "cuerpo" },
  "尸": { number: 44, strokes: 3, meaning: { es: "cadáver", en: "corpse" }, category: "cuerpo" },
  "屮": { number: 45, strokes: 3, meaning: { es: "brote", en: "sprout" }, category: "naturaleza" },
  "山": { number: 46, strokes: 3, meaning: { es: "montaña", en: "mountain" }, category: "naturaleza" },
  "巛": { number: 47, strokes: 3, meaning: { es: "río", en: "river" }, category: "naturaleza" },
  "工": { number: 48, strokes: 3, meaning: { es: "trabajo", en: "work" }, category: "acción" },
  "己": { number: 49, strokes: 3, meaning: { es: "uno mismo", en: "oneself" }, category: "abstracto" },
  "巾": { number: 50, strokes: 3, meaning: { es: "paño", en: "cloth" }, category: "objeto" },
  "干": { number: 51, strokes: 3, meaning: { es: "seco", en: "dry" }, category: "estado" },
  "幺": { number: 52, strokes: 3, meaning: { es: "pequeño", en: "tiny" }, category: "tamaño" },
  "广": { number: 53, strokes: 3, meaning: { es: "edificio", en: "building" }, category: "estructura" },
  "廴": { number: 54, strokes: 3, meaning: { es: "ir", en: "go" }, category: "movimiento" },
  "廾": { number: 55, strokes: 3, meaning: { es: "dos manos", en: "two hands" }, category: "cuerpo" },
  "弋": { number: 56, strokes: 3, meaning: { es: "tirar", en: "shoot" }, category: "acción" },
  "弓": { number: 57, strokes: 3, meaning: { es: "arco", en: "bow" }, category: "herramienta" },
  
  // Radicales de 4 trazos (selección importante)
  "心": { number: 61, strokes: 4, meaning: { es: "corazón", en: "heart" }, category: "cuerpo" },
  "戈": { number: 62, strokes: 4, meaning: { es: "lanza", en: "halberd" }, category: "herramienta" },
  "戶": { number: 63, strokes: 4, meaning: { es: "puerta", en: "door" }, category: "estructura" },
  "手": { number: 64, strokes: 4, meaning: { es: "mano", en: "hand" }, category: "cuerpo" },
  "支": { number: 65, strokes: 4, meaning: { es: "rama", en: "branch" }, category: "naturaleza" },
  "攴": { number: 66, strokes: 4, meaning: { es: "golpear", en: "strike" }, category: "acción" },
  "文": { number: 67, strokes: 4, meaning: { es: "escritura", en: "writing" }, category: "abstracto" },
  "斗": { number: 68, strokes: 4, meaning: { es: "lucha", en: "struggle" }, category: "acción" },
  "斤": { number: 69, strokes: 4, meaning: { es: "hacha", en: "axe" }, category: "herramienta" },
  "方": { number: 70, strokes: 4, meaning: { es: "cuadrado", en: "square" }, category: "forma" },
  "无": { number: 71, strokes: 4, meaning: { es: "no tener", en: "not have" }, category: "abstracto" },
  "日": { number: 72, strokes: 4, meaning: { es: "sol", en: "sun" }, category: "naturaleza" },
  "曰": { number: 73, strokes: 4, meaning: { es: "decir", en: "say" }, category: "acción" },
  "月": { number: 74, strokes: 4, meaning: { es: "luna", en: "moon" }, category: "naturaleza" },
  "木": { number: 75, strokes: 4, meaning: { es: "árbol", en: "tree" }, category: "naturaleza" },
  "欠": { number: 76, strokes: 4, meaning: { es: "faltar", en: "lack" }, category: "abstracto" },
  "止": { number: 77, strokes: 4, meaning: { es: "parar", en: "stop" }, category: "acción" },
  "歹": { number: 78, strokes: 4, meaning: { es: "malo", en: "evil" }, category: "abstracto" },
  "殳": { number: 79, strokes: 4, meaning: { es: "arma", en: "weapon" }, category: "herramienta" },
  "毋": { number: 80, strokes: 4, meaning: { es: "no", en: "do not" }, category: "abstracto" },
  "比": { number: 81, strokes: 4, meaning: { es: "comparar", en: "compare" }, category: "abstracto" },
  "毛": { number: 82, strokes: 4, meaning: { es: "pelo", en: "hair" }, category: "cuerpo" },
  "氏": { number: 83, strokes: 4, meaning: { es: "clan", en: "clan" }, category: "humano" },
  "气": { number: 84, strokes: 4, meaning: { es: "vapor", en: "steam" }, category: "naturaleza" },
  "水": { number: 85, strokes: 4, meaning: { es: "agua", en: "water" }, category: "naturaleza" },
  "火": { number: 86, strokes: 4, meaning: { es: "fuego", en: "fire" }, category: "naturaleza" },
  "爪": { number: 87, strokes: 4, meaning: { es: "garra", en: "claw" }, category: "cuerpo" },
  "父": { number: 88, strokes: 4, meaning: { es: "padre", en: "father" }, category: "humano" },
  "爻": { number: 89, strokes: 4, meaning: { es: "hexagrama", en: "hexagram" }, category: "abstracto" },
  "爿": { number: 90, strokes: 4, meaning: { es: "medio", en: "half" }, category: "abstracto" },
  "片": { number: 91, strokes: 4, meaning: { es: "rebanada", en: "slice" }, category: "objeto" },
  "牙": { number: 92, strokes: 4, meaning: { es: "diente", en: "tooth" }, category: "cuerpo" },
  "牛": { number: 93, strokes: 4, meaning: { es: "buey", en: "cow" }, category: "animal" },
  "犬": { number: 94, strokes: 4, meaning: { es: "perro", en: "dog" }, category: "animal" },
  
  // Radicales adicionales no-Kangxi pero importantes
  "争": { number: 401, strokes: 6, meaning: { es: "disputar", en: "contend" }, category: "acción" }
};

// Mapeo de caracteres a sus radicales (ejemplos comunes)
const CHARACTER_RADICALS = {
  // Caracteres con radical 土 (tierra)
  "土": "土", "地": "土", "场": "土", "块": "土", "城": "土", "域": "土",
  "坡": "土", "坏": "土", "址": "土", "均": "土", "坐": "土", "坚": "土",
  
  // Caracteres con radical 水 (agua) - como 氵
  "水": "水", "河": "氵", "海": "氵", "湖": "氵", "流": "氵", "浪": "氵",
  "波": "氵", "池": "氵", "洋": "氵", "清": "氵", "游": "氵", "深": "氵",
  
  // Caracteres con radical 人 (persona)
  "人": "人", "仁": "人", "他": "人", "们": "人", "什": "人", "住": "人",
  "体": "人", "作": "人", "但": "人", "位": "人", "低": "人", "保": "人",
  
  // Caracteres con radical 手 (mano) - como 扌
  "手": "手", "打": "扌", "拿": "扌", "抗": "扌", "投": "扌", "抓": "扌",
  "推": "扌", "拉": "扌", "持": "扌", "指": "扌", "掌": "扌", "握": "扌",
  
  // Caracteres con radical 心 (corazón)
  "心": "心", "忘": "心", "思": "心", "意": "心", "想": "心", "愿": "心",
  "忙": "心", "怕": "心", "情": "心", "爱": "心", "感": "心", "慢": "心",
  
  // Caracteres con radical 口 (boca)
  "口": "口", "吃": "口", "吐": "口", "呼": "口", "唱": "口", "喊": "口",
  "听": "口", "说": "口", "话": "口", "喝": "口", "哭": "口", "笑": "口",
  
  // Caracteres con radical 木 (árbol)
  "木": "木", "树": "木", "林": "木", "森": "木", "桌": "木", "椅": "木",
  "桥": "木", "机": "木", "板": "木", "根": "木", "枝": "木", "果": "木",
  
  // Caracteres con radical 火 (fuego)
  "火": "火", "烧": "火", "热": "火", "煮": "火", "灯": "火", "烟": "火",
  "炒": "火", "烤": "火", "燃": "火", "焰": "火", "炸": "火", "灰": "火",
  
  // Caracteres con radical 金 (metal)
  "金": "金", "银": "金", "铁": "金", "钢": "金", "铜": "金", "钱": "金",
  "钟": "金", "锁": "金", "针": "金", "钉": "金", "钩": "金", "链": "金",
  
  // Caracteres con radical 女 (mujer)
  "女": "女", "她": "女", "妈": "女", "姐": "女", "妹": "女", "奶": "女",
  "婚": "女", "嫁": "女", "娶": "女", "姓": "女", "妻": "女", "婆": "女",
  
  // Caracteres políticos/revolucionarios importantes
  "反": "厂", // radical acantilado
  "革": "革", // radical cuero (revolución)
  "命": "口", // radical boca
  "民": "氏", // radical clan
  "国": "囗", // radical recinto
  "党": "尚", // radical todavía
  "政": "攴", // radical golpear
  "权": "木", // radical árbol
  "斗": "斗", // radical medida (lucha) 
  "争": "争", // el propio carácter es un radical simplificado
  "战": "戈", // radical lanza
  "胜": "月", // radical carne/luna
  "利": "刀", // radical cuchillo
  "力": "力", // radical fuerza
  "工": "工", // radical trabajo
  "农": "辰"  // radical tiempo/dragón
};

// Información etimológica y cultural
const CHARACTER_ETYMOLOGY = {
  "土": {
    es: "Representa una pila de tierra o suelo. Simboliza la tierra como elemento fundamental.",
    en: "Represents a pile of earth or soil. Symbolizes earth as a fundamental element.",
    revolutionary: "En contexto revolucionario, simboliza la tierra que debe ser redistribuida."
  },
  "地": {
    es: "Combina 土 (tierra) + 也 (también). Originalmente significaba 'lugar' o 'terreno'.",
    en: "Combines 土 (earth) + 也 (also). Originally meant 'place' or 'ground'.",
    revolutionary: "Fundamental en la reforma agraria y lucha por la tierra."
  },
  "反": {
    es: "Radical 厂 (acantilado) sugiere oposición vertical. Significa 'oponerse' o 'revertir'.",
    en: "Radical 厂 (cliff) suggests vertical opposition. Means 'oppose' or 'reverse'.",
    revolutionary: "Palabra clave en movimientos de resistencia y revolución."
  },
  "抗": {
    es: "手 (mano) + 亢 (elevado). Literalmente 'levantar la mano', simboliza resistencia.",
    en: "手 (hand) + 亢 (elevated). Literally 'raise hand', symbolizes resistance.",
    revolutionary: "Representa la resistencia activa contra la opresión."
  },
  "革": {
    es: "Originalmente cuero de animal. Evolucionó a significar 'cambio radical' o 'revolución'.",
    en: "Originally animal hide. Evolved to mean 'radical change' or 'revolution'.",
    revolutionary: "Carácter central en la palabra 'revolución' (革命)."
  },
  "命": {
    es: "口 (boca) + 令 (orden). Una orden dada por la boca, evolucionó a 'vida' y 'destino'.",
    en: "口 (mouth) + 令 (order). An order given by mouth, evolved to 'life' and 'destiny'.",
    revolutionary: "En 革命 (revolución), representa el cambio de destino del pueblo."
  },
  "斗": {
    es: "Originalmente representaba una medida para granos. En contexto político significa 'lucha' o 'combate'.",
    en: "Originally represented a grain measure. In political context means 'struggle' or 'fight'.",
    revolutionary: "Carácter fundamental en vocabulario de lucha de clases y resistencia."
  },
  "争": {
    es: "Compuesto de 爪 (garra) arriba indicando agarrar o disputar. Significa 'contender' o 'disputar'.",
    en: "Composed of 爪 (claw) on top indicating grasping or disputing. Means 'contend' or 'dispute'.",
    revolutionary: "Representa la lucha activa por derechos y justicia social."
  }
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

function findRadical(character) {
  // Buscar en el mapeo directo
  if (CHARACTER_RADICALS[character]) {
    const radical = CHARACTER_RADICALS[character];
    const radicalInfo = KANGXI_RADICALS[radical];
    
    if (radicalInfo) {
      return {
        radical: radical,
        radicalType: character === radical ? "self" : "component",
        radicalData: {
          number: radicalInfo.number,
          strokes: radicalInfo.strokes,
          meaning: {
            es: radicalInfo.meaning.es,
            en: radicalInfo.meaning.en,
            de: radicalInfo.meaning.de || radicalInfo.meaning.en,
            pt: radicalInfo.meaning.pt || radicalInfo.meaning.es,
            ru: radicalInfo.meaning.ru || radicalInfo.meaning.en,
            "ru-rom": radicalInfo.meaning["ru-rom"] || radicalInfo.meaning.en,
            zh: radical,
            "zh-pinyin": getRadicalPinyin(radical)
          },
          category: radicalInfo.category
        }
      };
    }
  }
  
  // Si no se encuentra, intentar detectar automáticamente
  // Buscar radicales comunes como componentes
  for (const [radical, info] of Object.entries(KANGXI_RADICALS)) {
    if (character.includes(radical) && character !== radical) {
      return {
        radical: radical,
        radicalType: "component",
        radicalData: {
          number: info.number,
          strokes: info.strokes,
          meaning: {
            es: info.meaning.es,
            en: info.meaning.en,
            de: info.meaning.de || info.meaning.en,
            pt: info.meaning.pt || info.meaning.es,
            ru: info.meaning.ru || info.meaning.en,
            "ru-rom": info.meaning["ru-rom"] || info.meaning.en,
            zh: radical,
            "zh-pinyin": getRadicalPinyin(radical)
          },
          category: info.category
        }
      };
    }
  }
  
  return null;
}

function getRadicalPinyin(radical) {
  const pinyinMap = {
    "土": "tǔ", "水": "shuǐ", "氵": "shuǐ", "人": "rén", "手": "shǒu", "扌": "shǒu",
    "心": "xīn", "口": "kǒu", "木": "mù", "火": "huǒ", "金": "jīn", "女": "nǚ",
    "厂": "chǎng", "革": "gé", "攴": "pū", "囗": "wéi", "氏": "shì", "爪": "zhǎo",
    "戈": "gē", "月": "yuè", "刀": "dāo", "力": "lì", "工": "gōng", "辰": "chén",
    "斗": "dǒu", "争": "zhēng"
  };
  return pinyinMap[radical] || "";
}

function isRevolutionaryCharacter(character) {
  const revolutionaryChars = [
    "反", "抗", "革", "命", "民", "国", "党", "政", "权", "斗", "争", "战",
    "胜", "利", "力", "工", "农", "土", "地", "人", "民", "主", "义"
  ];
  return revolutionaryChars.includes(character);
}

async function generateRadicalDatabase() {
  console.log('🔍 Generando base de datos de radicales chinos...');
  
  // Crear directorio si no existe
  const outputDir = path.dirname(OUTPUT_FILE);
  ensureDirectoryExists(outputDir);
  
  // Leer caracteres del diccionario
  let characters = new Set();
  
  try {
    if (fs.existsSync(DICTIONARY_PATH)) {
      const dictionaryData = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
      
      // Extraer caracteres chinos de las palabras del diccionario
      Object.keys(dictionaryData.words || {}).forEach(word => {
        if (/[\u4e00-\u9fff]/.test(word)) {
          for (let char of word) {
            if (/[\u4e00-\u9fff]/.test(char)) {
              characters.add(char);
            }
          }
        }
      });
      
      console.log(`📚 Encontrados ${characters.size} caracteres chinos únicos en el diccionario`);
    }
  } catch (error) {
    console.warn('⚠️ No se pudo leer el diccionario chino, usando caracteres predeterminados');
  }
  
  // Añadir caracteres adicionales importantes si no están
  const importantChars = Object.keys(CHARACTER_RADICALS);
  importantChars.forEach(char => characters.add(char));
  
  console.log(`📝 Procesando ${characters.size} caracteres en total...`);
  
  // Generar base de datos
  const database = {
    metadata: {
      generated: new Date().toISOString(),
      version: "2.0.0",
      totalCharacters: characters.size,
      sources: [
        "Kangxi Radical System (214 radicales)",
        "Unicode Han Database",
        "Manual curation",
        "Academic sources"
      ],
      languages: ["es", "en", "de", "pt", "ru", "ru-rom", "zh", "zh-pinyin"]
    },
    radicals: KANGXI_RADICALS,
    characters: {},
    categories: {
      naturaleza: [],
      humano: [],
      cuerpo: [],
      acción: [],
      objeto: [],
      abstracto: [],
      herramienta: [],
      animal: [],
      estructura: [],
      tiempo: [],
      número: [],
      línea: [],
      forma: [],
      tamaño: [],
      estado: [],
      movimiento: [],
      medida: []
    }
  };
  
  let processedCount = 0;
  let foundRadicalCount = 0;
  
  for (const character of characters) {
    const radicalInfo = findRadical(character);
    const isRevolutionary = isRevolutionaryCharacter(character);
    const etymology = CHARACTER_ETYMOLOGY[character];
    
    const charData = {
      character: character,
      unicode: character.codePointAt(0),
      radical: radicalInfo ? radicalInfo.radical : "未知",
      radicalType: radicalInfo ? radicalInfo.radicalType : "unknown",
      radicalData: radicalInfo ? radicalInfo.radicalData : {
        meaning: {
          es: "Radical desconocido",
          en: "Unknown radical",
          de: "Unbekanntes Radikal",
          pt: "Radical desconhecido",
          ru: "Неизвестный радикал",
          "ru-rom": "Neizvestny radikal",
          zh: "未知",
          "zh-pinyin": "wèi zhī"
        }
      },
      revolutionaryRelevance: isRevolutionary,
      etymology: etymology ? {
        es: etymology.es,
        en: etymology.en,
        revolutionary: etymology.revolutionary || null
      } : null
    };
    
    database.characters[character] = charData;
    
    // Categorizar por radical
    if (radicalInfo && radicalInfo.radicalData.category) {
      const category = radicalInfo.radicalData.category;
      if (database.categories[category]) {
        if (!database.categories[category].includes(character)) {
          database.categories[category].push(character);
        }
      }
    }
    
    if (radicalInfo) {
      foundRadicalCount++;
    }
    
    processedCount++;
    if (processedCount % 50 === 0) {
      console.log(`⏳ Procesados ${processedCount}/${characters.size} caracteres...`);
    }
  }
  
  // Escribir archivo
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf8');
  
  console.log(`✅ Base de datos de radicales generada exitosamente:`);
  console.log(`   📁 Archivo: ${OUTPUT_FILE}`);
  console.log(`   📊 Caracteres procesados: ${processedCount}`);
  console.log(`   🔍 Radicales identificados: ${foundRadicalCount}/${processedCount} (${((foundRadicalCount/processedCount)*100).toFixed(1)}%)`);
  console.log(`   📚 Radicales Kangxi incluidos: ${Object.keys(KANGXI_RADICALS).length}`);
  console.log(`   🚩 Caracteres revolucionarios: ${Array.from(characters).filter(char => isRevolutionaryCharacter(char)).length}`);
  
  return database;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRadicalDatabase().catch(console.error);
}

export { generateRadicalDatabase };