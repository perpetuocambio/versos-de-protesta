/**
 * Cliente API para datos JSON estáticos
 * Simula comportamiento de API REST con cache y optimizaciones
 */

class StaticAPI {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Realizar petición GET con cache
   */
  async get(endpoint, options = {}) {
    const url = `${import.meta.env.BASE_URL}data${this.baseUrl}${endpoint}`;
    const cacheKey = url;

    // Verificar cache
    if (this.cache.has(cacheKey) && !options.bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit: ${endpoint}`);
        return cached.data;
      }
    }

    try {
      console.log(`🚀 Fetching: ${endpoint}`);
      const startTime = performance.now();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const loadTime = performance.now() - startTime;

      // Guardar en cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        loadTime
      });

      console.log(`✅ Loaded in ${loadTime.toFixed(2)}ms: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtener índice de diccionario
   */
  async getDictionaryIndex() {
    return this.get('/dictionary/index.json');
  }

  /**
   * Obtener metadatos de diccionario
   */
  async getDictionaryMeta() {
    return this.get('/dictionary/meta.json');
  }

  /**
   * Obtener diccionario por idioma
   */
  async getDictionaryLanguage(code) {
    return this.get(`/dictionary/languages/${code}.json`);
  }

  /**
   * Obtener índice de lecciones
   */
  async getLessonsIndex() {
    return this.get('/lessons/index.json');
  }

  /**
   * Obtener contenido de lección
   */
  async getLessonContent(dayId) {
    return this.get(`/lessons/content/${dayId}.json`);
  }

  /**
   * Obtener timeline de canciones
   */
  async getSongsTimeline() {
    return this.get('/songs/timeline.json');
  }

  /**
   * Obtener detalles de canción
   */
  async getSongDetails(songId) {
    return this.get(`/songs/details/${songId}.json`);
  }

  /**
   * Obtener palabras populares (cache)
   */
  async getPopularWords() {
    return this.get('/../cache/popular-words.json');
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: this.cache.size,
      entries: entries.map(([url, data]) => ({
        url,
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
    console.log('🔄 Precargando datos críticos...');
    
    const criticalEndpoints = [
      '/dictionary/index.json',
      '/lessons/index.json',
      '/songs/timeline.json',
      '/../cache/popular-words.json'
    ];

    const preloadPromises = criticalEndpoints.map(endpoint => 
      this.get(endpoint).catch(error => 
        console.warn(`⚠️ Preload failed for ${endpoint}:`, error.message)
      )
    );

    await Promise.allSettled(preloadPromises);
    console.log('✅ Precarga completada');
  }
}

// Instancia singleton
const api = new StaticAPI();

// Exportar instancia y clase
export { api, StaticAPI };
export default api;

/**
 * Hooks de utilidad para componentes
 */

/**
 * Hook para cargar datos con estado de carga
 */
export function createDataLoader(loadFunction) {
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
        console.error('Data loading error:', error);
      } finally {
        state.loading = false;
      }

      return state;
    }
  };
}

/**
 * Utilidades de cache para localStorage
 */
export const localCache = {
  set(key, data, ttl = 3600000) { // 1 hora por defecto
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    try {
      localStorage.setItem(`api_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage write failed:', error);
    }
  },

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`api_${key}`));
      if (!item) return null;

      const age = Date.now() - item.timestamp;
      if (age > item.ttl) {
        localStorage.removeItem(`api_${key}`);
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
      key.startsWith('api_') && key.includes(pattern)
    );
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keys.length} cache entries`);
  }
};

/**
 * Performance utilities
 */
export const performance = {
  measure(name, fn) {
    return async (...args) => {
      const start = window.performance.now();
      try {
        const result = await fn(...args);
        const duration = window.performance.now() - start;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = window.performance.now() - start;
        console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }
};