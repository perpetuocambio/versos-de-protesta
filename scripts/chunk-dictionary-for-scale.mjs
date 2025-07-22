#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Estrategia de chunking para escalabilidad a 100+ lecciones
 * 
 * Problemática actual:
 * - 12 lecciones = 330KB por idioma
 * - 100 lecciones = ~2.7MB por idioma (inviable)
 * 
 * Solución:
 * 1. Chunking por rango de lecciones (chunks de 20 lecciones)
 * 2. Índice ligero con metadatos
 * 3. Carga bajo demanda por chunks
 * 4. Cache inteligente
 */

async function chunkDictionaryForScale() {
  console.log('🔧 Optimizando diccionario para escalabilidad a 100+ lecciones...');
  
  try {
    const dataDir = path.join(projectRoot, 'public', 'data');
    const internalDir = path.join(dataDir, 'internal', 'v1', 'dictionary');
    const chunksDir = path.join(internalDir, 'chunks');
    
    // Crear directorio de chunks
    await fs.mkdir(chunksDir, { recursive: true });
    
    // Configuración de chunking
    const CHUNK_SIZE = 20; // 20 lecciones por chunk
    const MAX_CHUNK_SIZE_KB = 150; // Máximo 150KB por chunk
    
    // Leer datos existentes
    const languageFiles = [
      'es.json', 'en.json', 'de.json', 'pt.json', 
      'ru.json', 'ru-rom.json', 'zh.json', 'zh-pinyin.json'
    ];
    
    const chunkingResults = {};
    
    for (const langFile of languageFiles) {
      const langCode = langFile.replace('.json', '');
      console.log(`📦 Procesando chunks para ${langCode}...`);
      
      try {
        const langPath = path.join(internalDir, 'languages', langFile);
        const langData = JSON.parse(await fs.readFile(langPath, 'utf-8'));
        
        // Organizar palabras por lección
        const wordsByLesson = {};
        Object.entries(langData.words || {}).forEach(([word, data]) => {
          data.lessons.forEach(lesson => {
            if (!wordsByLesson[lesson]) {
              wordsByLesson[lesson] = {};
            }
            wordsByLesson[lesson][word] = data;
          });
        });
        
        // Agrupar lecciones en chunks
        const lessons = Object.keys(wordsByLesson).map(Number).sort((a, b) => a - b);
        const chunks = [];
        
        for (let i = 0; i < lessons.length; i += CHUNK_SIZE) {
          const chunkLessons = lessons.slice(i, i + CHUNK_SIZE);
          const chunkNumber = Math.floor(i / CHUNK_SIZE);
          
          // Combinar palabras del chunk
          const chunkWords = {};
          chunkLessons.forEach(lesson => {
            Object.entries(wordsByLesson[lesson] || {}).forEach(([word, data]) => {
              if (!chunkWords[word]) {
                chunkWords[word] = {
                  ...data,
                  lessons: []
                };
              }
              
              // Merge lessons evitando duplicados
              const newLessons = data.lessons.filter(l => 
                chunkLessons.includes(l) && !chunkWords[word].lessons.includes(l)
              );
              chunkWords[word].lessons.push(...newLessons);
            });
          });
          
          // Crear chunk
          const chunkData = {
            internal: {
              version: "1.0",
              chunkNumber,
              language: langCode,
              lessonsRange: {
                start: Math.min(...chunkLessons),
                end: Math.max(...chunkLessons)
              },
              lessons: chunkLessons.sort((a, b) => a - b),
              isPublic: false
            },
            meta: {
              wordCount: Object.keys(chunkWords).length,
              lessonsCount: chunkLessons.length,
              avgWordsPerLesson: Math.round(Object.keys(chunkWords).length / chunkLessons.length),
              generated: new Date().toISOString()
            },
            words: chunkWords
          };
          
          const chunkSize = JSON.stringify(chunkData).length / 1024; // KB
          
          // Guardar chunk
          const chunkFileName = `${langCode}-lessons-${chunkData.internal.lessonsRange.start}-${chunkData.internal.lessonsRange.end}.json`;
          const chunkPath = path.join(chunksDir, chunkFileName);
          
          await fs.writeFile(chunkPath, JSON.stringify(chunkData, null, 2), 'utf-8');
          
          chunks.push({
            number: chunkNumber,
            file: chunkFileName,
            lessonsRange: chunkData.internal.lessonsRange,
            lessons: chunkLessons,
            wordCount: chunkData.meta.wordCount,
            sizeKB: Math.round(chunkSize)
          });
          
          console.log(`   ✅ Chunk ${chunkNumber}: ${chunkLessons.join(',')}, ${chunkData.meta.wordCount} palabras, ${Math.round(chunkSize)}KB`);
        }
        
        chunkingResults[langCode] = chunks;
        
        // Crear índice del idioma optimizado
        const optimizedIndex = {
          internal: {
            version: "1.0",
            language: langCode,
            chunkingStrategy: "lessons-based",
            chunkSize: CHUNK_SIZE,
            isPublic: false
          },
          meta: {
            ...langData.meta,
            totalChunks: chunks.length,
            chunkingOptimized: true,
            estimatedLoadTimeMs: Math.max(...chunks.map(c => c.sizeKB)) * 2 // ~2ms per KB
          },
          chunks: chunks.map(chunk => ({
            number: chunk.number,
            file: chunk.file,
            lessonsRange: chunk.lessonsRange,
            wordCount: chunk.wordCount,
            sizeKB: chunk.sizeKB,
            path: `/internal/v1/dictionary/chunks/${chunk.file}`
          })),
          index: {
            // Índice de búsqueda rápida: lección -> chunk
            lessonToChunk: {},
            // Palabras más frecuentes (primeras 20 de cada chunk)
            popularWords: []
          }
        };
        
        // Construir índice de lecciones
        chunks.forEach(chunk => {
          chunk.lessons.forEach(lesson => {
            optimizedIndex.index.lessonToChunk[lesson] = chunk.number;
          });
        });
        
        // Palabras populares de todos los chunks
        const allWords = Object.entries(langData.words || {})
          .sort((a, b) => (b[1].frequency || 0) - (a[1].frequency || 0))
          .slice(0, 50)
          .map(([word, data]) => ({
            word,
            frequency: data.frequency,
            chunkNumbers: chunks
              .filter(chunk => chunk.lessons.some(lesson => data.lessons.includes(lesson)))
              .map(chunk => chunk.number)
          }));
        
        optimizedIndex.index.popularWords = allWords;
        
        // Guardar índice optimizado
        const indexPath = path.join(internalDir, 'languages', `${langCode}-index.json`);
        await fs.writeFile(indexPath, JSON.stringify(optimizedIndex, null, 2), 'utf-8');
        
        console.log(`   📋 Índice creado: ${chunks.length} chunks, búsqueda O(1) por lección`);
        
      } catch (error) {
        console.error(`   ❌ Error procesando ${langCode}:`, error.message);
      }
    }
    
    // Crear manifiesto global de chunks
    const globalManifest = {
      internal: {
        version: "1.0",
        chunkingEnabled: true,
        strategy: "lessons-based",
        maxChunkSizeKB: MAX_CHUNK_SIZE_KB,
        chunkSize: CHUNK_SIZE
      },
      meta: {
        totalLanguages: Object.keys(chunkingResults).length,
        totalChunks: Object.values(chunkingResults).reduce((sum, chunks) => sum + chunks.length, 0),
        scalabilityTarget: "100+ lessons",
        estimatedMaxSizeAt100Lessons: `${Math.ceil(100 / CHUNK_SIZE) * MAX_CHUNK_SIZE_KB}KB per language`,
        generated: new Date().toISOString()
      },
      languages: Object.entries(chunkingResults).map(([code, chunks]) => ({
        code,
        totalChunks: chunks.length,
        totalWords: chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0),
        estimatedSizeKB: chunks.reduce((sum, chunk) => sum + chunk.sizeKB, 0),
        chunksPath: `/internal/v1/dictionary/chunks/${code}-*`
      })),
      performance: {
        loadingStrategy: "chunk-on-demand",
        cacheStrategy: "aggressive-chunk-cache",
        indexLookup: "O(1) lesson->chunk",
        estimatedLoadTime: "50-100ms per chunk"
      }
    };
    
    await fs.writeFile(
      path.join(internalDir, 'chunks-manifest.json'),
      JSON.stringify(globalManifest, null, 2),
      'utf-8'
    );
    
    // Estadísticas finales
    const totalChunks = Object.values(chunkingResults).reduce((sum, chunks) => sum + chunks.length, 0);
    const avgChunkSize = Math.round(
      Object.values(chunkingResults)
        .flat()
        .reduce((sum, chunk) => sum + chunk.sizeKB, 0) / totalChunks
    );
    
    console.log('\\n📊 RESULTADOS DEL CHUNKING:');
    console.log(`   📦 Total de chunks creados: ${totalChunks}`);
    console.log(`   📏 Tamaño promedio por chunk: ${avgChunkSize}KB`);
    console.log(`   🎯 Escalabilidad objetivo: 100+ lecciones`);
    console.log(`   ⚡ Carga bajo demanda: ~${avgChunkSize * 2}ms por chunk`);
    console.log(`   💾 Estimación a 100 lecciones: ${Math.ceil(100/CHUNK_SIZE) * avgChunkSize}KB por idioma por chunk`);
    
    console.log('\\n✅ Optimización para escalabilidad completada');
    console.log('📁 Chunks: public/data/internal/v1/dictionary/chunks/');
    console.log('🔍 Índices: public/data/internal/v1/dictionary/languages/*-index.json');
    
  } catch (error) {
    console.error('❌ Error en optimización de escalabilidad:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  chunkDictionaryForScale().catch(console.error);
}

export { chunkDictionaryForScale };