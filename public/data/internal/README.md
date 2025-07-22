# Arquitectura de Datos Interna

## 📂 Estructura de Datos JSON Interna (No Expuesta)

Esta implementación usa una arquitectura tipo API REST ÚNICAMENTE para organización interna de datos. Los archivos JSON NO están expuestos públicamente como endpoints.

### 🔒 Seguridad y Privacidad

- **NO es una API pública**: Los datos están organizados internamente solamente
- **NO hay endpoints web**: Los archivos no son accesibles vía HTTP como API
- **Acceso solo por importación**: Los componentes importan datos directamente
- **Sin rutas expuestas**: No hay `/api/` ni endpoints públicos

### 🗂️ Estructura de Directorios Internos (Solo Diccionario)

```
public/data/internal/
├── v1/                          # Versionado interno de datos
│   └── dictionary/              # SOLO datos de diccionario
│       ├── index.json          # Lista de idiomas disponibles
│       ├── meta.json           # Metadatos globales
│       └── languages/          # Datos por idioma
│           ├── es.json         # Datos español
│           ├── en.json         # Datos inglés
│           ├── de.json         # Datos alemán
│           ├── pt.json         # Datos portugués
│           ├── ru.json         # Datos ruso
│           ├── ru-rom.json     # Datos ruso romanizado
│           ├── zh.json         # Datos chino
│           └── zh-pinyin.json  # Datos chino pinyin
└── cache/                       # Cache y índices optimizados
    └── popular-words.json      # Palabras más frecuentes
```

**Notas:**
- **Lecciones**: Se mantienen como archivos .md en `/src/content/blog/`
- **Canciones**: Timeline generado desde datos de lecciones dinámicamente
- **Solo diccionario**: Requiere estructura interna por su tamaño y complejidad

### 🚀 Ventajas de la Arquitectura

1. **Escalabilidad**: Fácil agregar nuevos idiomas/lecciones
2. **Performance**: Carga bajo demanda (lazy loading)
3. **Caching**: Índices optimizados para búsquedas
4. **Versionado**: Soporte para múltiples versiones de API
5. **Modularidad**: Endpoints independientes

### 📊 Estimaciones de Rendimiento Interno (Solo Diccionario)

| Archivo | Tamaño Aprox. | Tiempo Import | Uso |
|---------|--------------|---------------|-----|
| `dictionary/index.json` | ~2KB | ~10ms | Lista idiomas |
| `dictionary/meta.json` | ~4KB | ~10ms | Metadatos |
| `dictionary/languages/es.json` | ~330KB | ~50ms | Diccionario ES |
| `dictionary/languages/en.json` | ~330KB | ~50ms | Diccionario EN |
| `dictionary/languages/[lang].json` | ~330KB | ~50ms | Otros idiomas |
| `cache/popular-words.json` | ~8KB | ~15ms | Palabras populares |

### 🔧 Implementación Interna

- **Importación estática**: `import data from '../data/internal/v1/...'`
- **Lazy loading**: Importación dinámica cuando se necesita
- **Cache optimizado**: Índices pre-computados para búsquedas
- **Separación modular**: Cada tipo de dato en su propio archivo
- **Versionado**: Soporte para evolución de estructura de datos

### 💡 Ejemplo de Uso (Solo Diccionario)

```javascript
// ❌ NO - No hay endpoints HTTP públicos
// const data = await fetch('/api/v1/dictionary/index.json');

// ✅ SÍ - Importación directa estática
import dictionaryIndex from '../data/internal/v1/dictionary/index.json';

// ✅ SÍ - Importación dinámica (recomendado para idiomas)
const esData = await import('../data/internal/v1/dictionary/languages/es.json');

// ✅ SÍ - Para datos de lecciones (desde content collections)
import { getCollection } from 'astro:content';
const lessons = await getCollection('blog');

// ✅ SÍ - Timeline de canciones generado desde lecciones
const songsTimeline = lessons
  .filter(lesson => lesson.data.originalSong)
  .map(lesson => ({
    year: lesson.data.originalSong.year,
    title: lesson.data.originalSong.title,
    // ...
  }));
```