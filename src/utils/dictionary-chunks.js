/**
 * Cliente optimizado para diccionario con chunks
 * Escalable a 100+ lecciones con carga bajo demanda
 */

class ChunkedDictionary {
  constructor() {
    this.chunkCache = new Map();
    this.indexCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
    this.basePath = '../data/internal/v1/dictionary';
  }

  /**
   * Cargar índice de idioma (ligero, contiene mapeo lección->chunk)
   */
  async loadLanguageIndex(langCode) {
    const cacheKey = `index-${langCode}`;
    
    if (this.indexCache.has(cacheKey)) {
      const cached = this.indexCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log(`📋 Loading index for ${langCode}...`);
      const indexModule = await import(`${this.basePath}/languages/${langCode}-index.json`);
      const indexData = indexModule.default;

      this.indexCache.set(cacheKey, {
        data: indexData,
        timestamp: Date.now()
      });

      console.log(`✅ Index loaded: ${indexData.meta.totalChunks} chunks available`);
      return indexData;

    } catch (error) {
      console.error(`❌ Error loading index for ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Cargar chunk específico
   */
  async loadChunk(langCode, chunkNumber) {
    const cacheKey = `chunk-${langCode}-${chunkNumber}`;
    
    if (this.chunkCache.has(cacheKey)) {
      const cached = this.chunkCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit: chunk ${chunkNumber} for ${langCode}`);
        return cached.data;
      }
    }

    try {
      // Primero obtener info del chunk desde el índice
      const index = await this.loadLanguageIndex(langCode);
      const chunkInfo = index.chunks.find(c => c.number === chunkNumber);
      
      if (!chunkInfo) {
        throw new Error(`Chunk ${chunkNumber} not found for ${langCode}`);
      }

      console.log(`📦 Loading chunk ${chunkNumber} for ${langCode} (${chunkInfo.sizeKB}KB)...`);
      const startTime = performance.now();
      
      const chunkModule = await import(`${this.basePath}/chunks/${chunkInfo.file}`);
      const chunkData = chunkModule.default;
      
      const loadTime = performance.now() - startTime;

      this.chunkCache.set(cacheKey, {
        data: chunkData,
        timestamp: Date.now(),
        loadTime
      });

      console.log(`✅ Chunk loaded in ${loadTime.toFixed(2)}ms: ${chunkData.meta.wordCount} words`);
      return chunkData;

    } catch (error) {
      console.error(`❌ Error loading chunk ${chunkNumber} for ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Obtener palabras de lecciones específicas
   */
  async getWordsForLessons(langCode, lessons) {
    try {
      const index = await this.loadLanguageIndex(langCode);
      const requiredChunks = new Set();
      
      // Determinar qué chunks necesitamos
      lessons.forEach(lesson => {
        const chunkNumber = index.index.lessonToChunk[lesson];
        if (chunkNumber !== undefined) {
          requiredChunks.add(chunkNumber);
        }
      });

      console.log(`🔍 Need chunks [${Array.from(requiredChunks).join(',')}] for lessons [${lessons.join(',')}]`);

      // Cargar chunks en paralelo
      const chunkPromises = Array.from(requiredChunks).map(chunkNum => 
        this.loadChunk(langCode, chunkNum)
      );
      
      const chunks = await Promise.all(chunkPromises);
      
      // Combinar palabras de todos los chunks filtradas por lecciones
      const combinedWords = {};
      chunks.forEach(chunk => {
        Object.entries(chunk.words).forEach(([word, data]) => {
          // Solo incluir si la palabra está en las lecciones solicitadas
          const relevantLessons = data.lessons.filter(lesson => lessons.includes(lesson));
          if (relevantLessons.length > 0) {
            combinedWords[word] = {
              ...data,
              lessons: relevantLessons
            };
          }
        });
      });

      const stats = {
        requestedLessons: lessons,
        chunksLoaded: requiredChunks.size,
        totalWords: Object.keys(combinedWords).length,
        avgWordsPerLesson: Math.round(Object.keys(combinedWords).length / lessons.length)
      };

      console.log(`📊 Combined: ${stats.totalWords} words from ${stats.chunksLoaded} chunks`);

      return {
        words: combinedWords,
        meta: {
          language: langCode,
          ...stats,
          generated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ Error getting words for lessons:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las palabras de un idioma (carga todos los chunks)
   */
  async getAllWords(langCode) {
    try {
      const index = await this.loadLanguageIndex(langCode);
      const allChunkNumbers = index.chunks.map(c => c.number);
      
      console.log(`🔄 Loading all ${allChunkNumbers.length} chunks for ${langCode}...`);
      
      const chunkPromises = allChunkNumbers.map(chunkNum => 
        this.loadChunk(langCode, chunkNum)
      );
      
      const chunks = await Promise.all(chunkPromises);
      
      // Combinar todas las palabras
      const allWords = {};
      chunks.forEach(chunk => {
        Object.entries(chunk.words).forEach(([word, data]) => {
          if (!allWords[word]) {
            allWords[word] = { ...data };
          } else {
            // Merge lessons de múltiples chunks
            const combinedLessons = [...new Set([
              ...allWords[word].lessons,
              ...data.lessons
            ])].sort((a, b) => a - b);
            
            allWords[word] = {
              ...allWords[word],
              lessons: combinedLessons,
              frequency: combinedLessons.length
            };
          }
        });
      });

      return {
        words: allWords,
        meta: {
          language: langCode,
          totalWords: Object.keys(allWords).length,
          chunksLoaded: chunks.length,
          generated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ Error getting all words for ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Buscar palabras por término (búsqueda optimizada)
   */
  async searchWords(langCode, searchTerm, limit = 50) {
    try {
      // Primero buscar en palabras populares (disponibles en el índice)
      const index = await this.loadLanguageIndex(langCode);
      const popularMatches = index.index.popularWords
        .filter(item => item.word.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, Math.min(limit, 20));

      if (popularMatches.length >= limit) {
        // Si tenemos suficientes resultados populares, devolver solo esos
        return {
          words: popularMatches.reduce((acc, item) => {
            acc[item.word] = {
              frequency: item.frequency,
              chunkNumbers: item.chunkNumbers,
              isPopular: true
            };
            return acc;
          }, {}),
          meta: {
            searchTerm,
            totalMatches: popularMatches.length,
            source: 'popular-index-only',
            fast: true
          }
        };
      }

      // Si necesitamos más resultados, cargar chunks específicos
      const chunksToSearch = [...new Set(popularMatches.flatMap(item => item.chunkNumbers))];
      
      if (chunksToSearch.length === 0) {
        // Si no hay chunks específicos, usar chunk 0 por defecto
        chunksToSearch.push(0);
      }

      console.log(`🔍 Searching in chunks [${chunksToSearch.join(',')}] for "${searchTerm}"`);

      const chunkPromises = chunksToSearch.slice(0, 3).map(chunkNum => // Máximo 3 chunks
        this.loadChunk(langCode, chunkNum)
      );
      
      const chunks = await Promise.all(chunkPromises);
      
      // Buscar en todos los chunks cargados
      const allMatches = {};
      chunks.forEach(chunk => {
        Object.entries(chunk.words).forEach(([word, data]) => {
          if (word.toLowerCase().includes(searchTerm.toLowerCase())) {
            allMatches[word] = data;
          }
        });
      });

      // Ordenar por frecuencia y limitar
      const sortedMatches = Object.entries(allMatches)
        .sort((a, b) => (b[1].frequency || 0) - (a[1].frequency || 0))
        .slice(0, limit)
        .reduce((acc, [word, data]) => {
          acc[word] = data;
          return acc;
        }, {});

      return {
        words: sortedMatches,
        meta: {
          searchTerm,
          totalMatches: Object.keys(sortedMatches).length,
          chunksSearched: chunksToSearch.length,
          source: 'chunk-search'
        }
      };

    } catch (error) {
      console.error(`❌ Error searching words:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats() {
    return {
      chunkCache: {
        size: this.chunkCache.size,
        entries: Array.from(this.chunkCache.keys())
      },
      indexCache: {
        size: this.indexCache.size,
        entries: Array.from(this.indexCache.keys())
      },
      totalMemoryEstimate: (this.chunkCache.size * 200 + this.indexCache.size * 50) + 'KB'
    };
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.chunkCache.clear();
    this.indexCache.clear();
    console.log('🧹 Dictionary chunks cache cleared');
  }

  /**
   * Precargar chunks para lecciones específicas
   */
  async preloadForLessons(langCode, lessons) {
    console.log(`⚡ Preloading chunks for lessons [${lessons.join(',')}] in ${langCode}...`);
    
    try {
      await this.getWordsForLessons(langCode, lessons);
      console.log('✅ Preload completed');
    } catch (error) {
      console.warn('⚠️ Preload failed:', error.message);
    }
  }
}

// Instancia singleton
const chunkedDictionary = new ChunkedDictionary();

export { chunkedDictionary, ChunkedDictionary };
export default chunkedDictionary;