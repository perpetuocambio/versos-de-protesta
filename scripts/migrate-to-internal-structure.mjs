#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function migrateToInternalStructure() {
  console.log('🔄 Migrando diccionario a estructura interna...');
  
  try {
    const dataDir = path.join(projectRoot, 'src', 'data');
    const internalDir = path.join(dataDir, 'internal', 'v1');
    
    // Leer datos existentes
    const dictionaryStats = JSON.parse(
      await fs.readFile(path.join(dataDir, 'dictionary-stats.json'), 'utf-8')
    );
    
    // 1. Migrar SOLO diccionarios por idioma
    console.log('📚 Migrando diccionarios por idioma...');
    const langDir = path.join(dataDir, 'lang');
    const internalLangDir = path.join(internalDir, 'dictionary', 'languages');
    
    // Crear estructura de directorios
    await fs.mkdir(internalLangDir, { recursive: true });
    await fs.mkdir(path.join(dataDir, 'internal', 'cache'), { recursive: true });
    
    const languageMap = {
      'spanish.json': 'es.json',
      'english.json': 'en.json',
      'german.json': 'de.json',
      'portuguese.json': 'pt.json',
      'russian.json': 'ru.json',
      'russian-rom.json': 'ru-rom.json',
      'chinese.json': 'zh.json',
      'chinese-pinyin.json': 'zh-pinyin.json'
    };
    
    for (const [oldFile, newFile] of Object.entries(languageMap)) {
      const oldPath = path.join(langDir, oldFile);
      const newPath = path.join(internalLangDir, newFile);
      
      try {
        // Leer y transformar datos
        const langData = JSON.parse(await fs.readFile(oldPath, 'utf-8'));
        
        // Enriquecer con metadatos internos
        const internalLangData = {
          ...langData,
          internal: {
            version: "1.0",
            path: `/internal/v1/dictionary/languages/${newFile}`,
            lastModified: new Date().toISOString(),
            etag: generateETag(langData),
            isPublic: false,
            accessType: "import-only"
          },
          performance: {
            size: JSON.stringify(langData).length,
            estimatedLoadTime: estimateLoadTime(JSON.stringify(langData).length),
            compressionRatio: 0.3
          }
        };
        
        await fs.writeFile(newPath, JSON.stringify(internalLangData, null, 2), 'utf-8');
        console.log(`   ✅ ${oldFile} → ${newFile}`);
        
      } catch (error) {
        console.warn(`   ⚠️ No se pudo migrar ${oldFile}:`, error.message);
      }
    }
    
    // 2. Crear índice interno del diccionario
    console.log('📝 Creando índice interno de diccionario...');
    
    const dictionaryIndex = {
      version: "1.0",
      internal: {
        path: "/internal/v1/dictionary",
        isPublic: false,
        accessType: "import-only"
      },
      meta: {
        totalLanguages: 8,
        totalWords: dictionaryStats.totalUniqueWords,
        totalEntries: dictionaryStats.totalEntries,
        lastUpdated: new Date().toISOString(),
        description: "Diccionario interno multilingüe de himnos obreros"
      },
      languages: [
        {
          code: "es",
          name: "Español",
          nativeName: "Español",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "es.json",
          flag: "🇪🇸"
        },
        {
          code: "en", 
          name: "English",
          nativeName: "English",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "en.json",
          flag: "🇬🇧"
        },
        {
          code: "de",
          name: "Deutsch", 
          nativeName: "Deutsch",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "de.json",
          flag: "🇩🇪"
        },
        {
          code: "pt",
          name: "Português",
          nativeName: "Português", 
          wordCount: dictionaryStats.totalUniqueWords,
          file: "pt.json",
          flag: "🇵🇹"
        },
        {
          code: "ru",
          name: "Русский",
          nativeName: "Русский",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "ru.json",
          flag: "🇷🇺"
        },
        {
          code: "ru-rom",
          name: "Русский Rom.",
          nativeName: "Russky Romanized",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "ru-rom.json",
          flag: "🇷🇺"
        },
        {
          code: "zh",
          name: "中文",
          nativeName: "中文",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "zh.json",
          flag: "🇨🇳"
        },
        {
          code: "zh-pinyin", 
          name: "中文 Pinyin",
          nativeName: "Zhōngwén Pinyin",
          wordCount: dictionaryStats.totalUniqueWords,
          file: "zh-pinyin.json",
          flag: "🇨🇳"
        }
      ]
    };
    
    await fs.writeFile(
      path.join(internalDir, 'dictionary', 'index.json'),
      JSON.stringify(dictionaryIndex, null, 2),
      'utf-8'
    );
    
    // 3. Crear metadatos del diccionario
    const dictionaryMeta = {
      version: "1.0",
      internal: {
        path: "/internal/v1/dictionary/meta",
        isPublic: false
      },
      dictionary: {
        id: "versos-de-protesta-dict",
        name: "Diccionario Interno de Himnos Obreros",
        description: "Vocabulario interno extraído del análisis de himnos revolucionarios",
        methodology: "Extracción automática de vocabulario de canciones obreras históricas",
        scope: "Música obrera, sindicalismo, revolución, resistencia histórica",
        sources: [
          "Himnos anarquistas españoles",
          "Cancionero socialista internacional", 
          "Música de resistencia soviética",
          "Nueva Canción latinoamericana",
          "Canciones obreras alemanas",
          "Protest songs anglófonos",
          "Música revolucionaria china"
        ]
      },
      statistics: dictionaryStats,
      maintenance: {
        lastUpdated: new Date().toISOString(),
        updateFrequency: "on-content-change",
        autoGenerated: true
      }
    };
    
    await fs.writeFile(
      path.join(internalDir, 'dictionary', 'meta.json'),
      JSON.stringify(dictionaryMeta, null, 2),
      'utf-8'
    );
    
    // 4. Crear cache de palabras populares
    console.log('💾 Generando cache de palabras populares...');
    const popularWords = await generatePopularWordsCache(dataDir);
    await fs.writeFile(
      path.join(dataDir, 'internal', 'cache', 'popular-words.json'),
      JSON.stringify(popularWords, null, 2),
      'utf-8'
    );
    
    // 5. Limpiar archivos obsoletos del directorio lang
    console.log('🧹 Limpiando archivos obsoletos...');
    try {
      await fs.rm(langDir, { recursive: true });
      console.log('   🗑️ Directorio lang/ eliminado (migrado a internal/)');
    } catch (error) {
      console.warn('   ⚠️ No se pudo eliminar directorio lang/:', error.message);
    }
    
    console.log('\\n✅ Migración a estructura interna completada');
    console.log('📁 Diccionario interno: src/data/internal/v1/dictionary/');
    console.log('💾 Cache optimizado: src/data/internal/cache/');
    console.log('🔒 Estructura NO expuesta públicamente');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Funciones auxiliares
function generateETag(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
}

function estimateLoadTime(sizeBytes) {
  // Estima tiempo de carga basado en import interno (~50ms por 300KB)
  const bytesPerMs = 300000 / 50;
  return Math.round(sizeBytes / bytesPerMs);
}

async function generatePopularWordsCache(dataDir) {
  const langFiles = [
    'spanish.json', 'english.json', 'german.json', 'portuguese.json',
    'russian.json', 'chinese.json'
  ];
  
  const wordFrequency = new Map();
  
  for (const file of langFiles) {
    try {
      const langPath = path.join(dataDir, 'lang', file);
      const langData = JSON.parse(await fs.readFile(langPath, 'utf-8'));
      
      Object.entries(langData.words || {}).forEach(([word, data]) => {
        const frequency = data.frequency || data.entries?.length || 1;
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + frequency);
      });
    } catch (error) {
      console.warn(`No se pudo leer ${file} para cache:`, error.message);
    }
  }
  
  const topWords = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, frequency]) => ({ word, frequency }));
  
  return {
    version: "1.0",
    internal: {
      path: "/internal/cache/popular-words",
      isPublic: false
    },
    meta: {
      totalWords: wordFrequency.size,
      topWords: 50,
      minFrequency: topWords[topWords.length - 1]?.frequency || 1,
      maxFrequency: topWords[0]?.frequency || 1
    },
    words: topWords,
    generated: new Date().toISOString()
  };
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToInternalStructure().catch(console.error);
}

export { migrateToInternalStructure };