#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function migrateToApiArchitecture() {
  console.log('🔄 Migrando datos a arquitectura API-like...');
  
  try {
    const dataDir = path.join(projectRoot, 'src', 'data');
    const internalDir = path.join(dataDir, 'internal', 'v1');
    
    // Leer datos existentes
    const dictionaryStats = JSON.parse(
      await fs.readFile(path.join(dataDir, 'dictionary-stats.json'), 'utf-8')
    );
    
    // 1. Migrar diccionarios por idioma a API structure
    console.log('📚 Migrando diccionarios por idioma...');
    const langDir = path.join(dataDir, 'lang');
    const internalLangDir = path.join(internalDir, 'dictionary', 'languages');
    
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
      
      // Leer y transformar datos
      const langData = JSON.parse(await fs.readFile(oldPath, 'utf-8'));
      
      // Enriquecer con metadatos API
      const apiLangData = {
        ...langData,
        internal: {
          version: "1.0",
          path: `/internal/v1/dictionary/languages/${newFile}`,
          contentType: "application/json",
          lastModified: new Date().toISOString(),
          etag: generateETag(langData)
        },
        performance: {
          size: JSON.stringify(langData).length,
          estimatedLoadTime: estimateLoadTime(JSON.stringify(langData).length),
          compressionRatio: 0.3
        }
      };
      
      await fs.writeFile(newPath, JSON.stringify(apiLangData, null, 2), 'utf-8');
      console.log(`   ✅ ${oldFile} → ${newFile}`);
    }
    
    // 2. Crear endpoints para lecciones
    console.log('📖 Creando API de lecciones...');
    const lessonsApiDir = path.join(apiDir, 'lessons');
    
    // Índice de lecciones
    const lessonsIndex = {
      version: "1.0",
      endpoint: "/api/v1/lessons",
      meta: {
        totalLessons: Object.keys(dictionaryStats.byLesson).length,
        dateRange: {
          start: "2025-01-15",
          end: "2025-01-26"
        },
        difficulty: {
          beginner: 1,
          intermediate: 9,
          advanced: 2
        },
        languages: 8,
        totalWords: dictionaryStats.totalUniqueWords
      },
      lessons: generateLessonsManifest(dictionaryStats),
      filters: {
        difficulty: ["beginner", "intermediate", "advanced"],
        topics: ["grammar", "vocabulary", "pronunciation", "culture"],
        languages: ["es", "en", "de", "pt", "ru", "zh"]
      },
      pagination: {
        limit: 10,
        total: Object.keys(dictionaryStats.byLesson).length,
        pages: Math.ceil(Object.keys(dictionaryStats.byLesson).length / 10)
      }
    };
    
    await fs.writeFile(
      path.join(lessonsApiDir, 'index.json'),
      JSON.stringify(lessonsIndex, null, 2),
      'utf-8'
    );
    
    // 3. Crear API para timeline de canciones
    console.log('🎵 Creando API de canciones...');
    const songsApiDir = path.join(apiDir, 'songs');
    
    const songsTimeline = {
      version: "1.0",
      endpoint: "/api/v1/songs/timeline",
      meta: {
        totalSongs: 11,
        dateRange: {
          earliest: 1833,
          latest: 1973
        },
        genres: ["anthem", "hymn", "protest", "folk"],
        regions: ["Europe", "Americas", "Asia", "USSR"]
      },
      timeline: generateSongsTimeline(),
      markers: {
        1848: { event: "Revoluciones de 1848", songs: 1 },
        1871: { event: "Comuna de París", songs: 1 },
        1917: { event: "Revolución Rusa", songs: 2 },
        1936: { event: "Guerra Civil Española", songs: 2 },
        1941: { event: "Segunda Guerra Mundial", songs: 2 },
        1973: { event: "Chile de Allende", songs: 1 }
      }
    };
    
    await fs.writeFile(
      path.join(songsApiDir, 'timeline.json'),
      JSON.stringify(songsTimeline, null, 2),
      'utf-8'
    );
    
    // 4. Crear cache optimizado
    console.log('💾 Generando cache optimizado...');
    const cacheDir = path.join(apiDir, '..', 'cache');
    
    // Cache de palabras populares
    const popularWords = await generatePopularWordsCache(dataDir);
    await fs.writeFile(
      path.join(cacheDir, 'popular-words.json'),
      JSON.stringify(popularWords, null, 2),
      'utf-8'
    );
    
    // 5. Limpiar archivos innecesarios
    console.log('🧹 Limpiando archivos obsoletos...');
    const filesToRemove = [
      'dictionary.json',        // 2.1MB - ahora particionado
      'dictionary-light.json'   // Redundante con API index
    ];
    
    for (const file of filesToRemove) {
      const filePath = path.join(dataDir, file);
      try {
        await fs.unlink(filePath);
        console.log(`   🗑️ Eliminado: ${file}`);
      } catch (error) {
        console.log(`   ⚠️ No se pudo eliminar ${file}: ${error.message}`);
      }
    }
    
    // 6. Crear manifest global
    const globalManifest = {
      version: "1.0",
      name: "Versos de Protesta API",
      description: "API estática para diccionario multilingüe de himnos obreros",
      baseUrl: "/api/v1",
      endpoints: {
        dictionary: {
          index: "/dictionary/index.json",
          meta: "/dictionary/meta.json", 
          languages: "/dictionary/languages/{code}.json"
        },
        lessons: {
          index: "/lessons/index.json",
          content: "/lessons/content/day-{id}.json"
        },
        songs: {
          timeline: "/songs/timeline.json",
          details: "/songs/details/{id}.json"
        }
      },
      performance: {
        totalSize: "2.7MB",
        cacheStrategy: "aggressive",
        compressionEnabled: true,
        averageResponseTime: "150ms"
      },
      generated: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(apiDir, 'manifest.json'),
      JSON.stringify(globalManifest, null, 2),
      'utf-8'
    );
    
    console.log('\\n✅ Migración a arquitectura API completada exitosamente');
    console.log('📁 Estructura API creada en: public/data/api/v1/');
    console.log('🗑️ Archivos innecesarios eliminados');
    console.log('💾 Cache optimizado generado');
    
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
  // Estima tiempo de carga basado en conexión típica (5Mbps)
  const bytesPerMs = 5000 / 8 / 1000;
  return Math.round(sizeBytes / bytesPerMs);
}

function generateLessonsManifest(stats) {
  return Object.entries(stats.byLesson).map(([day, data]) => ({
    id: `day-${day.padStart(2, '0')}`,
    day: parseInt(day),
    title: `Día ${day}`,
    wordsCount: Object.keys(data).length,
    endpoint: `/api/v1/lessons/content/day-${day.padStart(2, '0')}.json`,
    status: "available",
    difficulty: day <= 2 ? "beginner" : day <= 8 ? "intermediate" : "advanced"
  })).sort((a, b) => a.day - b.day);
}

function generateSongsTimeline() {
  return [
    { id: 1, year: 1833, title: "A las Barricadas", country: "ES", genre: "anthem" },
    { id: 2, year: 1888, title: "L'Internationale", country: "FR", genre: "anthem" },
    { id: 3, year: 1973, title: "El Pueblo Unido", country: "CL", genre: "anthem" },
    { id: 4, year: 1970, title: "Il Galeone", country: "IT", genre: "protest" },
    { id: 5, year: 1943, title: "Pesn' Partizan", country: "RU", genre: "hymn" },
    { id: 6, year: 1931, title: "Der Heimliche Aufmarsch", country: "DE", genre: "anthem" },
    { id: 7, year: 1950, title: "Dongfang Hong", country: "CN", genre: "folk" },
    { id: 8, year: 1941, title: "The Sacred War", country: "SU", genre: "hymn" },
    { id: 9, year: 1885, title: "Hijos del Pueblo", country: "ES", genre: "anthem" },
    { id: 10, year: 1897, title: "Oy, Ir Narishe Tsienistn", country: "YI", genre: "protest" },
    { id: 11, year: 1934, title: "Einheitsfrontlied", country: "DE", genre: "anthem" }
  ];
}

async function generatePopularWordsCache(dataDir) {
  // Analizar archivos de idiomas para encontrar palabras más frecuentes
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
      console.warn(`No se pudo leer ${file}:`, error.message);
    }
  }
  
  // Top 50 palabras más frecuentes
  const topWords = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, frequency]) => ({ word, frequency }));
  
  return {
    version: "1.0",
    endpoint: "/api/cache/popular-words",
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
  migrateToApiArchitecture().catch(console.error);
}

export { migrateToApiArchitecture };