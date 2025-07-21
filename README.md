# 🌍 Versos de Protesta - Blog Multilingüe

## 📖 Descripción del Proyecto

**Versos de Protesta** es un blog de aprendizaje de idiomas innovador que utiliza canciones revolucionarias e himnos históricos como base para la enseñanza multilingüe. A través del análisis comparativo de música de protesta, exploramos 5 idiomas simultáneamente: **Español**, **English**, **Deutsch**, **Português**, **Русский**, **中文** y sus respectivas romanizaciones.

## 🎯 Filosofía de Aprendizaje

- **CERO ejercicios tradicionales** → **TODO documentación y consulta**
- **Una canción** → **5 idiomas paralelos** → **Material de referencia completo**
- **Música como base cultural** → Contexto histórico auténtico
- **Tablas exhaustivas** → Gramática, vocabulario, IPA y conjugaciones
- **Fracaso productivo** → No entender el 30% es el nivel óptimo

## 🚀 Tecnologías Utilizadas

- **Framework**: [Astro](https://astro.build/) - Generación de sitios estáticos
- **Hosting**: GitHub Pages
- **Content Management**: Content Collections con TypeScript
- **Styling**: CSS nativo con diseño responsive
- **Deployment**: GitHub Actions automático

## 📚 Estructura del Contenido

### Idiomas Cubiertos
1. 🇪🇸 **Español** - Idioma base/referencia
2. 🇬🇧 **English** - Traducciones completas con IPA
3. 🇩🇪 **Deutsch** - Gramática compleja y declinaciones
4. 🇵🇹 **Português** - Contraste sistemático con español
5. 🇷🇺 **Русский** - Texto en cirílico + 6 casos
6. 🇷🇺 **Romanización** - Equivalente romanizado del ruso
7. 🇨🇳 **中文** - Hanzi tradicionales/simplificados
8. 🇨🇳 **Pinyin** - Romanización con tonos obligatorios

### Tipos de Contenido
- **📺 Análisis de Canciones**: Traducciones multilingües con contexto histórico
- **📖 Lecciones Temáticas**: Gramática comparativa y vocabulario
- **🗣️ Pronunciación**: IPA palabra por palabra
- **📊 Tablas de Referencia**: Conjugaciones, declinaciones, números

## 🏗️ Estructura del Proyecto

```
src/
├── content/
│   ├── blog/               # Contenido principal en markdown
│   └── config.ts          # Esquemas y configuración de contenido
├── layouts/
│   ├── Layout.astro       # Layout principal con navegación
│   └── BlogPost.astro     # Layout específico para posts
├── pages/
│   ├── index.astro        # Página principal
│   ├── blog.astro         # Lista de todas las lecciones
│   ├── idiomas.astro      # Navegación por idioma
│   ├── canciones.astro    # Biblioteca de canciones
│   └── about.astro        # Información del proyecto
└── components/            # Componentes reutilizables
```

## 🚀 Desarrollo Local

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn

### Instalación y Ejecución
```bash
# Clonar el repositorio
git clone https://github.com/perpetuocambio/versos-de-protesta.git
cd versos-de-protesta

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

## 📝 Guía de Contenido

### Frontmatter Requerido
Cada archivo de contenido debe incluir metadatos específicos:

```yaml
---
title: "DÍA X: [TÍTULO CANCIÓN]"
description: "Análisis multilingüe con traducciones, gramática e IPA"
pubDate: 2024-01-0X
contentType: "song-analysis"
primaryLanguages: ["es", "en", "de", "pt", "ru", "zh"]
originalSong:
  title: "[Título original]"
  artist: "[Artista]"
  year: AÑO
grammarTopics: ["tema1", "tema2"]
---
```

### Estructura de Contenido
- **🎵 Canción Original**: Letra completa en idioma fuente
- **📊 Contexto Histórico**: Fechas y datos en 5 idiomas
- **🔄 Traducciones**: 8 versiones separadas manteniendo métrica
- **📈 Vocabulario**: Tablas comparativas con IPA
- **🔧 Gramática**: Análisis exhaustivo por idioma
- **🗣️ Pronunciación**: IPA completo línea por línea
- **📝 Conjugaciones**: Verbos en todos los tiempos

## 🌐 Deployment

El sitio se despliega automáticamente en GitHub Pages mediante GitHub Actions:
- **URL**: https://perpetuocambio.github.io/versos-de-protesta/
- **Trigger**: Push a la rama `main`
- **Build**: Astro con configuración para GitHub Pages

## 📊 Métricas de Éxito

### Cada mes evaluar:
- ¿Puedo distinguir el "sabor" único de cada idioma?
- ¿Empiezo a pensar conceptos across languages?
- ¿Hay transferencias positivas entre idiomas?
- ¿Mi tolerancia a la ambigüedad ha aumentado?

### Objetivos a 6 meses:
- **🇬🇧 English**: B2+ → C1 emergente
- **🇩🇪 Deutsch**: A2 comunicativo funcional  
- **🇵🇹 Português**: A2 aprovechando español
- **🇷🇺 Русский**: A1 básico pero real
- **🇨🇳 中文**: A1 con bases sólidas

## 🤝 Contribución

Este proyecto es de código abierto para fines educativos. Las contribuciones son bienvenidas:

1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-cancion`)
3. Commit de cambios (`git commit -m 'Agregar análisis de La Marsellesa'`)
4. Push a la rama (`git push origin feature/nueva-cancion`)
5. Crear Pull Request

### Estándares de Contenido
- Seguir estructura de 5 idiomas paralelos
- Incluir frontmatter completo
- Mantener separación absoluta (cirílico ≠ romanización)
- Proporcionar IPA cuando corresponda
- Verificar contexto histórico preciso

## 📜 Licencia

Este proyecto está bajo licencia Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).

**Puedes:**
- ✅ Compartir - copiar y redistribuir en cualquier medio
- ✅ Adaptar - remezclar, transformar y construir sobre el material
- ✅ Usar para fines educativos y personales

**No puedes:**
- ❌ Usar con fines comerciales
- ❌ Vender el contenido o derivados

## 🎵 Canciones Incluidas

- **Día 1**: "A las Barricadas" - Himno anarquista español
- **Día 2**: "L'Internationale" - Himno internacional socialista
- **Más contenido**: Ver [MASTER-GUIDE.md](./MASTER-GUIDE.md) para metodología completa

## 📞 Contacto

- **GitHub**: [@perpetuocambio](https://github.com/perpetuocambio)
- **Issues**: [Reportar problemas](https://github.com/perpetuocambio/versos-de-protesta/issues)
- **Documentación**: Ver [MASTER-GUIDE.md](./MASTER-GUIDE.md)

---

> *"La música es el lenguaje universal que trasciende fronteras. A través de las canciones de protesta, no solo aprendemos idiomas, sino que conectamos con la historia y las luchas humanas que nos unen."*
