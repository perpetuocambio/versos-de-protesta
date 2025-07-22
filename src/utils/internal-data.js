/**
 * Cliente de datos internos para archivos JSON estáticos
 * NO expone endpoints públicos - solo importación interna
 */

class InternalDataClient {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.basePath = '../data/internal/v1';
  }

  /**
   * Cargar datos con cache interno
   */
  async loadData(path) {
    const cacheKey = path;

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit: ${path}`);
        return cached.data;
      }
    }

    try {
      console.log(`🔄 Loading: ${path}`);
      const startTime = performance.now();
      
      // Importación dinámica interna (NO HTTP)
      const module = await import(`${this.basePath}${path}`);
      const data = module.default;
      
      const loadTime = performance.now() - startTime;

      // Guardar en cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        loadTime
      });

      console.log(`✅ Loaded in ${loadTime.toFixed(2)}ms: ${path}`);
      return data;

    } catch (error) {
      console.error(`❌ Error loading ${path}:`, error);
      throw error;
    }
  }

  /**
   * Obtener índice de diccionario
   */
  async getDictionaryIndex() {
    return this.loadData('/dictionary/index.json');
  }

  /**
   * Obtener metadatos de diccionario
   */
  async getDictionaryMeta() {
    return this.loadData('/dictionary/meta.json');
  }

  /**
   * Obtener diccionario por idioma
   */
  async getDictionaryLanguage(code) {
    return this.loadData(`/dictionary/languages/${code}.json`);
  }

  /**
   * Obtener índice de lecciones
   */
  async getLessonsIndex() {
    return this.loadData('/lessons/index.json');
  }

  /**
   * Obtener contenido de lección
   */
  async getLessonContent(dayId) {
    return this.loadData(`/lessons/content/${dayId}.json`);
  }

  /**
   * Obtener timeline de canciones
   */
  async getSongsTimeline() {
    return this.loadData('/songs/timeline.json');
  }

  /**
   * Obtener detalles de canción
   */
  async getSongDetails(songId) {
    return this.loadData(`/songs/details/${songId}.json`);
  }

  /**
   * Obtener palabras populares (cache)
   */
  async getPopularWords() {
    return this.loadData('/../cache/popular-words.json');
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Internal cache cleared');
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: this.cache.size,
      entries: entries.map(([path, data]) => ({
        path,
        timestamp: data.timestamp,
        age: Date.now() - data.timestamp,
        loadTime: data.loadTime
      })),
      totalMemory: JSON.stringify(entries).length
    };
  }

  /**
   * Precargar datos críticos
   */
  async preload() {
    console.log('🔄 Precargando datos internos críticos...');
    
    const criticalPaths = [
      '/dictionary/index.json',
      '/lessons/index.json',
      '/songs/timeline.json',
      '/../cache/popular-words.json'
    ];

    const preloadPromises = criticalPaths.map(path => 
      this.loadData(path).catch(error => 
        console.warn(`⚠️ Preload failed for ${path}:`, error.message)
      )
    );

    await Promise.allSettled(preloadPromises);
    console.log('✅ Precarga interna completada');
  }
}

// Instancia singleton
const internalData = new InternalDataClient();

// Exportar instancia y clase
export { internalData, InternalDataClient };
export default internalData;

/**
 * Utilidades de cache para localStorage (datos derivados)
 */
export const localCache = {
  set(key, data, ttl = 3600000) { // 1 hora por defecto
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    try {
      localStorage.setItem(`internal_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage write failed:', error);
    }
  },

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`internal_${key}`));
      if (!item) return null;

      const age = Date.now() - item.timestamp;
      if (age > item.ttl) {
        localStorage.removeItem(`internal_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('LocalStorage read failed:', error);
      return null;
    }
  },

  clear(pattern = '') {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('internal_') && key.includes(pattern)
    );
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keys.length} local cache entries`);
  }
};

/**
 * Hook de datos para componentes
 */
export function createInternalLoader(loadFunction) {
  return {
    async load(params, options = {}) {
      const state = {
        loading: true,
        data: null,
        error: null,
        loadTime: 0
      };

      try {
        const startTime = performance.now();
        state.data = await loadFunction(params, options);
        state.loadTime = performance.now() - startTime;
      } catch (error) {
        state.error = error;
        console.error('Internal data loading error:', error);
      } finally {
        state.loading = false;
      }

      return state;
    }
  };
}