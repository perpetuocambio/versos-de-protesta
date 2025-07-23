/**
 * Cliente optimizado para diccionario con chunks
 * Escalable a 100+ lecciones con carga bajo demanda
 * Compatible server-side (Node.js) y client-side (Browser)
 */

import fs from 'fs/promises';
import path from 'path';

class ChunkedDictionary {
  constructor() {
    this.chunkCache = new Map();
    this.indexCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
    this.basePath = '../data/internal/v1/dictionary';
    
    // Detectar entorno de ejecución
    this.isServerSide = typeof window === 'undefined';
    
    if (this.isServerSide) {
      // Ruta absoluta para server-side - detectar si estamos en build o dev
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const possiblePaths = [
        // Durante build de Astro
        path.resolve('./public/data/internal/v1/dictionary'),
        // Durante desarrollo
        path.resolve(__dirname, '../../public/data/internal/v1/dictionary'),
        // Path relativo como fallback
        path.resolve('public/data/internal/v1/dictionary'),
        // Para cuando estamos en subdirectorios
        path.resolve(__dirname, '../../../public/data/internal/v1/dictionary')
      ];
      
      console.log('🔍 Buscando dictionary path entre:', possiblePaths);
      
      // Usar el primer path que exista
      this.serverBasePath = possiblePaths.find(p => {
        try {
          const fs = require('fs');
          const exists = fs.existsSync(p);
          console.log(`  ${exists ? '✅' : '❌'} ${p}`);
          return exists;
        } catch (e) {
          console.log(`  ❌ ${p} (error: ${e.message})`);
          return false;
        }
      });
      
      if (!this.serverBasePath) {
        console.error('❌ No se encontró ningún path válido para dictionary');
        this.serverBasePath = possiblePaths[0]; // fallback
      } else {
        console.log(`✅ Dictionary path seleccionado: ${this.serverBasePath}`);
      }
    }
  }

  /**
   * Cargar manifest de chunks
   */
  async loadManifest() {
    if (this.indexCache.has('manifest')) {
      const cached = this.indexCache.get('manifest');
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log('📋 Loading chunks manifest...');
      let manifestData;
      
      if (this.isServerSide) {
        // Server-side: usar fs
        const manifestPath = path.join(this.serverBasePath, 'chunks-manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifestData = JSON.parse(manifestContent);
      } else {
        // Client-side: usar fetch
        const manifestResponse = await fetch(`${import.meta.env.BASE_URL}data/internal/v1/dictionary/chunks-manifest.json`);
        if (!manifestResponse.ok) throw new Error('No se pudo cargar el manifest');
        manifestData = await manifestResponse.json();
      }

      this.indexCache.set('manifest', {
        data: manifestData,
        timestamp: Date.now()
      });

      console.log(`✅ Manifest loaded: ${manifestData.meta.totalLanguages} languages`);
      return manifestData;

    } catch (error) {
      console.error('❌ Error loading manifest:', error);
      throw error;
    }
  }

  /**
   * Cargar chunk específico
   */
  async loadChunk(langCode) {
    const cacheKey = `chunk-${langCode}`;
    
    if (this.chunkCache.has(cacheKey)) {
      const cached = this.chunkCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit: chunk for ${langCode}`);
        return cached.data;
      }
    }

    try {
      // Obtener info del manifest
      const manifest = await this.loadManifest();
      const langManifest = manifest.languages.find(lang => lang.code === langCode);
      
      if (!langManifest) {
        throw new Error(`Language ${langCode} not found in manifest`);
      }

      // Generar nombre del archivo (asumiendo patrón lessons-0-11.json)
      const chunkFile = langManifest.chunksPath.split('/').pop().replace('*', 'lessons-0-11.json');
      
      console.log(`📦 Loading chunk for ${langCode}: ${chunkFile}`);
      const startTime = this.isServerSide ? Date.now() : performance.now();
      
      let chunkData;
      
      if (this.isServerSide) {
        // Server-side: usar fs
        const chunkPath = path.join(this.serverBasePath, 'chunks', chunkFile);
        const chunkContent = await fs.readFile(chunkPath, 'utf-8');
        chunkData = JSON.parse(chunkContent);
      } else {
        // Client-side: usar fetch
        const chunkResponse = await fetch(`${import.meta.env.BASE_URL}data/internal/v1/dictionary/chunks/${chunkFile}`);
        if (!chunkResponse.ok) throw new Error(`No se pudo cargar ${chunkFile}`);
        chunkData = await chunkResponse.json();
      }
      
      const loadTime = (this.isServerSide ? Date.now() : performance.now()) - startTime;

      this.chunkCache.set(cacheKey, {
        data: chunkData,
        timestamp: Date.now(),
        loadTime
      });

      console.log(`✅ Chunk loaded in ${loadTime.toFixed(2)}ms: ${chunkData.meta.wordCount} words`);
      return chunkData;

    } catch (error) {
      console.error(`❌ Error loading chunk for ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Obtener palabras de lecciones específicas
   */
  async getWordsForLessons(langCode, lessons) {
    try {
      console.log(`🔍 Getting words for lessons [${lessons.join(',')}] in ${langCode}`);
      
      const chunkData = await this.loadChunk(langCode);
      
      // Filtrar palabras por lecciones específicas
      const filteredWords = {};
      Object.entries(chunkData.words).forEach(([word, data]) => {
        const relevantLessons = data.lessons.filter(lesson => lessons.includes(lesson));
        if (relevantLessons.length > 0) {
          filteredWords[word] = {
            ...data,
            lessons: relevantLessons
          };
        }
      });

      const stats = {
        requestedLessons: lessons,
        chunksLoaded: 1,
        totalWords: Object.keys(filteredWords).length,
        avgWordsPerLesson: Math.round(Object.keys(filteredWords).length / lessons.length)
      };

      console.log(`📊 Filtered: ${stats.totalWords} words from ${lessons.length} lessons`);

      return {
        words: filteredWords,
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
   * Obtener todas las palabras de un idioma
   */
  async getAllWords(langCode) {
    try {
      console.log(`🔄 Loading all words for ${langCode}...`);
      
      const chunkData = await this.loadChunk(langCode);
      
      return {
        words: chunkData.words,
        meta: {
          language: langCode,
          totalWords: Object.keys(chunkData.words).length,
          chunksLoaded: 1,
          generated: chunkData.meta.generated
        }
      };

    } catch (error) {
      console.error(`❌ Error getting all words for ${langCode}:`, error);
      throw error;
    }
  }

  /**
   * Buscar palabras por término
   */
  async searchWords(langCode, searchTerm, limit = 50) {
    try {
      console.log(`🔍 Searching for "${searchTerm}" in ${langCode}`);
      
      const chunkData = await this.loadChunk(langCode);
      
      // Buscar en todas las palabras
      const matches = {};
      Object.entries(chunkData.words).forEach(([word, data]) => {
        if (word.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches[word] = data;
        }
      });

      // Ordenar por frecuencia y limitar
      const sortedMatches = Object.entries(matches)
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
          chunksSearched: 1,
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
   * Precargar chunk para un idioma
   */
  async preloadForLanguage(langCode) {
    console.log(`⚡ Preloading chunk for ${langCode}...`);
    
    try {
      await this.loadChunk(langCode);
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