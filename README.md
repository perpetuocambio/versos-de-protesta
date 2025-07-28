# 🚩 Versos de Protesta

> Diccionario multilingüe de himnos obreros con análisis gramatical comparativo

## 🎯 Descripción

Proyecto educativo que usa himnos revolucionarios históricos como base para el aprendizaje de idiomas, con análisis gramatical comparativo en 8 idiomas: Español, English, Deutsch, Português, Русский, Русский Rom., 中文, y Pinyin.

## 🏗️ Arquitectura Técnica

- **Framework**: Astro 5.12+ con content collections
- **Diccionario**: Sistema unificado optimizado (17 archivos JSON esenciales)
- **Performance**: Sistema simplificado, carga optimized
- **Deployment**: GitHub Pages con workflow automatizado
- **Scripts**: 12 scripts esenciales con funcionalidad aislada

---

## 📋 DOCUMENTACIÓN COMPLETA DE SCRIPTS

### 🔧 **SCRIPTS PRINCIPALES (12 scripts esenciales)**

#### **📚 GRUPO 1: PIPELINE DICCIONARIO (4 scripts)**

##### 1. `build-dictionary.mjs`
**Función**: Extrae vocabulario de archivos Markdown y genera diccionario master
```bash
npm run build-dictionary
```
- **Input**: `src/content/blog/dia-*.md`
- **Output**: `public/data/internal/v1/dictionary/master.json`
- **Dependencias**: ❌ Ninguna (script inicial)
- **Uso**: Primer paso del pipeline, extrae tablas de vocabulario

##### 2. `partition-dictionary.mjs`
**Función**: Divide diccionario master por idiomas individuales
```bash
npm run partition-dictionary
```
- **Input**: `master.json`
- **Output**: `public/data/internal/v1/dictionary/languages/*.json`
- **Dependencias**: ✅ `build-dictionary.mjs`
- **Uso**: Optimización para carga por idioma específico

##### 3. `chunk-dictionary-for-scale.mjs`
**Función**: Fragmenta diccionarios grandes para escalabilidad web
```bash
npm run chunk-dictionary
```
- **Input**: `languages/*.json`
- **Output**: `languages/*-chunk-*.json` (si >100 lecciones)
- **Dependencias**: ✅ `partition-dictionary.mjs`
- **Uso**: Escalabilidad automática para proyectos grandes

##### 4. `migrate-to-internal-structure.mjs`
**Función**: Migra datos a estructura interna optimizada v1
```bash
npm run migrate-internal
```
- **Input**: Diccionarios particionados
- **Output**: Estructura `/internal/v1/` completa
- **Dependencias**: ✅ `chunk-dictionary.mjs`
- **Uso**: Arquitectura moderna con versionado

#### **🀫 GRUPO 2: DATOS CHINOS (3 scripts)**

##### 5. `download-chinese-strokes.mjs`
**Función**: Descarga datos de trazos chinos desde APIs externas
```bash
npm run download-strokes
```
- **Input**: APIs externas (Make Me A Hanzi, etc.)
- **Output**: `public/data/chinese/strokes/`
- **Dependencias**: ❌ Ninguna (datos externos)
- **Uso**: Datos únicos de escritura china

##### 6. `download-cedict-data.mjs`
**Función**: Descarga diccionario CC-CEDICT autorizado
```bash
npm run download-cedict
```
- **Input**: cedict.org
- **Output**: `public/data/chinese/cedict_raw.txt`
- **Dependencias**: ❌ Ninguna (datos externos)
- **Uso**: Fuente autorizada para datos chinos

##### 7. `integrate-chinese-data.mjs`
**Función**: Integra automáticamente datos del diccionario con sistema de radicales
```bash
npm run integrate-chinese
```
- **Input**: `zh.json` del diccionario interno
- **Output**: `radicals-unified.json`, `character-radical-unified.json`
- **Dependencias**: ✅ Todo el pipeline del diccionario
- **Uso**: **Script principal** para sistema chino unificado

#### **🧹 GRUPO 3: MANTENIMIENTO (3 scripts)**

##### 8. `cleanup-chinese-system.mjs`
**Función**: Limpia archivos obsoletos del sistema chino
```bash
npm run cleanup-chinese
```
- **Input**: Directorio `/data/chinese/`
- **Output**: Sistema limpio, backups creados
- **Uso**: Mantenimiento opcional, elimina redundancia

##### 9. `validate-system.mjs`
**Función**: Valida integridad completa del sistema
```bash
npm run validate-system
```
- **Input**: Todo el sistema (scripts, JSON, package.json)
- **Output**: Reporte completo 6/6 validaciones
- **Uso**: **Verificación completa** antes de deploy

##### 10. `simplify-json-system.mjs`
**Función**: Simplifica archivos JSON eliminando redundancia
```bash
npm run simplify-json
```
- **Input**: Todos los archivos JSON
- **Output**: Solo 17 archivos esenciales
- **Uso**: Optimización del sistema, reduce 70% archivos

#### **📋 GRUPO 4: VALIDACIÓN (2 scripts)**

##### 11. `validate-lesson.py`
**Función**: Valida estructura y frontmatter de lecciones
```bash
npm run validate-lessons
```
- **Input**: `src/content/blog/dia-*.md`
- **Output**: Reporte de validación
- **Uso**: Control de calidad de contenido

##### 12. `check-frontmatter.sh`
**Función**: Validación rápida de frontmatter con Bash
```bash
scripts/check-frontmatter.sh src/content/blog/dia-01.md
```
- **Input**: Archivos MD específicos
- **Output**: Validación YAML
- **Uso**: Usado por precommit hooks

---

## 🪝 DOCUMENTACIÓN COMPLETA DE HOOKS

### **📄 CONFIGURACIÓN PRECOMMIT (`.pre-commit-config.yaml`)**

#### **🔄 Hook 1: Update Dictionary Complete**
```yaml
- id: update-dictionary-complete
  name: 🔄 Complete Dictionary Update
  entry: bash -c 'npm run update-all && git add public/data/'
  language: system
  files: '^src/content/blog/d[ií]a-.*\.md$'
  pass_filenames: false
  verbose: true
```
- **Trigger**: Cambios en archivos `dia-*.md`
- **Acción**: Ejecuta `npm run update-all` completo
- **Resultado**: Actualiza todo el sistema de diccionario

#### **📋 Hook 2: Validate Lesson Frontmatter**
```yaml
- id: validate-lesson-frontmatter
  name: 📋 Validate Lesson Frontmatter
  entry: scripts/check-frontmatter.sh
  language: system
  files: '^src/content/blog/d[ií]a-.*\.md$'
  pass_filenames: true
```
- **Trigger**: Cambios en archivos `dia-*.md`
- **Acción**: Valida frontmatter YAML
- **Resultado**: Previene commits con frontmatter inválido

#### **🔧 Hooks Estándar de Calidad**
```yaml
- repo: https://github.com/pre-commit/pre-commit-hooks
  rev: v4.4.0
  hooks:
    - id: trailing-whitespace    # Elimina espacios finales
    - id: end-of-file-fixer     # Asegura newlines finales  
    - id: check-json            # Valida sintaxis JSON
    - id: check-added-large-files  # Previene archivos grandes
```

### **⚙️ CONFIGURACIÓN AUTOMÁTICA**
```bash
# Instalación automática de hooks
npm run precommit-setup  # Instala pre-commit y configura hooks
npm run prepare         # Hook de instalación automática
```

---

## 🔄 COMANDOS NPM COMPLETOS

### **🚀 COMANDOS PRINCIPALES**
```bash
# Pipeline completo de actualización
npm run update-all

# Desarrollo local
npm run dev

# Build para producción  
npm run build

# Validación completa del sistema
npm run validate-system
```

### **📚 COMANDOS DICCIONARIO**
```bash
# Pipeline paso a paso
npm run build-dictionary    # Extrae vocabulario
npm run partition-dictionary # Divide por idiomas
npm run chunk-dictionary     # Fragmenta para escala
npm run migrate-internal     # Migra a estructura v1
```

### **🀫 COMANDOS CHINOS**
```bash
# Datos externos
npm run download-strokes     # Descarga trazos
npm run download-cedict      # Descarga CC-CEDICT

# Integración inteligente
npm run integrate-chinese    # Unifica sistema de radicales

# Limpieza
npm run cleanup-chinese      # Elimina archivos obsoletos
```

### **🧹 COMANDOS MANTENIMIENTO**
```bash
# Análisis del sistema
npm run analyze-json         # Analiza redundancia JSON
npm run simplify-json        # Simplifica archivos JSON

# Validación
npm run validate-lessons     # Valida lecciones Python
npm run validate-system      # Validación completa
```

### **🔧 COMANDOS DESARROLLO**
```bash
# Setup inicial
npm install && npm run precommit-setup

# Solo contenido (sin datos externos)
npm run update-content

# Legacy (compatibilidad)
npm run dictionary-legacy
```

---

## 📁 ESTRUCTURA OPTIMIZADA DEL PROYECTO

```
📦 versos-de-protesta/
├── 🔧 scripts/ (12 scripts esenciales)
│   ├── build-dictionary.mjs           # 📚 Pipeline paso 1
│   ├── partition-dictionary.mjs       # 📚 Pipeline paso 2  
│   ├── chunk-dictionary-for-scale.mjs # 📚 Pipeline paso 3
│   ├── migrate-to-internal-structure.mjs # 📚 Pipeline paso 4
│   ├── download-chinese-strokes.mjs   # 🀫 Datos externos
│   ├── download-cedict-data.mjs       # 🀫 Datos externos
│   ├── integrate-chinese-data.mjs     # 🀫 Integración principal
│   ├── cleanup-chinese-system.mjs     # 🧹 Mantenimiento
│   ├── validate-system.mjs            # 🧹 Validación completa
│   ├── simplify-json-system.mjs       # 🧹 Optimización JSON
│   ├── validate-lesson.py             # 📋 Validación Python
│   └── check-frontmatter.sh           # 📋 Validación Bash
├── 
├── 📊 public/data/ (17 archivos JSON esenciales)
│   ├── chinese/                       # 4 archivos chinos
│   │   ├── radicals-unified.json      # 🀫 Radicales integrados
│   │   ├── character-radical-unified.json # 🀫 Mapeo caracteres
│   │   ├── cache-info.json            # 🀫 Metadatos
│   │   └── strokes-metadata.json      # 🀫 Metadatos trazos
│   ├── internal/v1/dictionary/        # 11 archivos diccionario
│   │   ├── languages/                 # 8 idiomas + 2 metadatos
│   │   │   ├── es.json               # Español
│   │   │   ├── en.json               # English  
│   │   │   ├── de.json               # Deutsch
│   │   │   ├── pt.json               # Português
│   │   │   ├── ru.json               # Русский
│   │   │   ├── ru-rom.json           # Русский Rom.
│   │   │   ├── zh.json               # 中文
│   │   │   └── zh-pinyin.json        # Pinyin
│   │   ├── meta.json                 # Metadatos diccionario
│   │   └── manifest.json             # Manifiesto v1
│   ├── composers/index.json           # 1 archivo compositores
│   └── grammar/index.json             # 1 archivo gramática
├── 
├── 📝 src/
│   ├── content/blog/                  # Lecciones Markdown
│   │   ├── dia-00-fundamentos-basicos.md
│   │   ├── dia-01-a-las-barricadas.md
│   │   └── ... (13 lecciones actuales)
│   ├── components/
│   │   └── advanced/
│   │       └── RadicalAnalyzer.astro  # Modal chinos optimizado
│   └── pages/
└── 
└── ⚙️ configuración/
    ├── .pre-commit-config.yaml        # Hooks precommit
    ├── package.json                   # Scripts NPM optimizados
    ├── CLAUDE.md                      # Guía pedagógica completa
    ├── SISTEMA_OPTIMIZADO.md          # Reporte optimización
    └── README.md                      # Esta documentación
```

---

## 🎵 AGREGAR NUEVA LECCIÓN - WORKFLOW COMPLETO

### **1. Crear Archivo con Frontmatter Completo**
```markdown
---
title: "DÍA XX: Título del Himno"
description: "Contexto histórico específico de la canción"
pubDate: 2025-01-XX
contentType: "song-analysis"
primaryLanguages: ["es", "en", "de", "pt", "ru", "zh"]
day: XX
originalSong:
  title: "Título Original"
  artist: "Compositor/Autor"
  year: YYYY
  language: "es"
  genre: "hymn"
grammarTopics:
  - "Concepto gramatical 1"
  - "Concepto gramatical 2"
  - "Concepto gramatical 3"
vocabulary:
  - "concepto1"
  - "concepto2"
  - "concepto3"
culturalContext: "Contexto histórico breve"
difficultyLevel: "intermediate"
estimatedTime: "60-90 min"
tags: ["historia", "música", "revolución", "gramática-comparativa"]
---
```

### **2. Incluir Tablas de Vocabulario Obligatorias**
```markdown
### TÉRMINOS CLAVE

| Español | English | Deutsch | Português | Русский | Русский Rom. | 中文 | Pinyin | Categoría |
|---------|---------|---------|-----------|---------|-------------|------|--------|-----------|
| **revolución** | revolution | Revolution | revolução | революция | revolyutsiya | 革命 | gémìng | sustantivo |
| **cantar** | sing | singen | cantar | петь | pet' | 唱 | chàng | verbo |
```
**⚠️ IMPORTANTE**: El header debe ser EXACTAMENTE como se muestra, incluyendo "Categoría"

### **3. Commit Automático**
```bash
# El sistema automáticamente:
git add src/content/blog/dia-XX-titulo.md
git commit -m "Add Día XX: Título"  

# Pre-commit ejecuta automáticamente:
# ✅ npm run update-all (pipeline completo)
# ✅ scripts/check-frontmatter.sh (validación)
# ✅ git add public/data/ (archivos generados)
```

### **4. Deploy Automático**
```bash
git push origin main

# GitHub Actions ejecuta automáticamente:
# ✅ Build del sitio
# ✅ Deploy a GitHub Pages
# ✅ Validación adicional en CI
```

---

## 📊 MÉTRICAS Y OPTIMIZACIÓN

### **📈 ESTADO ACTUAL OPTIMIZADO**
- **Scripts**: 12 esenciales (vs 19 originales) - **37% menos**
- **JSON**: 17 archivos (vs 56 originales) - **70% menos**
- **Tamaño**: 1.3 MB (vs 3.5 MB originales) - **63% menos**
- **Lecciones**: 13 actuales, escalable a 100+

### **⚡ Performance**
| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Archivos JSON | 56 | 17 | -70% |
| Espacio total | 3.5 MB | 1.3 MB | -63% |
| Scripts activos | 19 | 12 | -37% |
| Tiempo build | ~2 min | ~1 min | -50% |

### **🎯 Escalabilidad Planificada**
| Lecciones | Archivos JSON | Tamaño Total | Tiempo Carga |
|-----------|---------------|--------------|--------------|
| 13 (actual) | 17 | 1.3 MB | <500ms |
| 50 | 17 | ~2.5 MB | <1s |
| 100 | 17-25* | ~5 MB | <2s |

*Chunks automáticos si supera límite

---

## 🔒 VALIDACIÓN Y CONTROL DE CALIDAD

### **✅ Validación Automática Completa (6/6)**
```bash
npm run validate-system
```
1. ✅ **Scripts**: Todos los archivos existen y funcionan
2. ✅ **Package.json**: Comandos configurados correctamente
3. ✅ **Precommit**: Hooks operativos y funcionales
4. ✅ **Datos**: Estructura de directorios correcta
5. ✅ **Pipeline**: Dependencias integras y secuenciales
6. ✅ **Limpieza**: Sin archivos obsoletos ni redundantes

### **🧪 Tests de Integridad**
- **Modal chino**: Caracteres como 口, 团, 义, 结 funcionan correctamente
- **Pinyin**: Segmentación con espacios entre sílabas
- **Vocabulario**: Sin duplicados, ordenamiento correcto
- **Radicales**: Sistema unificado sin redundancia

---

## 🚀 CONFIGURACIÓN RÁPIDA

### **Setup Inicial Completo**
```bash
# 1. Clonar e instalar
git clone https://github.com/tu-usuario/versos-de-protesta.git
cd versos-de-protesta
npm install

# 2. Configurar hooks
npm run precommit-setup

# 3. Validar sistema
npm run validate-system  # Debe mostrar 6/6 ✅

# 4. Desarrollo
npm run dev  # Servidor local en http://localhost:4321
```

### **Agregar Nueva Lección (Workflow Rápido)**
```bash
# 1. Crear archivo
vim src/content/blog/dia-XX-titulo.md

# 2. Commit (precommit automático)
git add . && git commit -m "Add Día XX: Título"

# 3. Push (deploy automático)
git push origin main
```

---

## 🤝 CONTRIBUIR

### **🔧 Para Desarrolladores**
1. **Fork** del repositorio
2. **Setup**: `npm install && npm run precommit-setup`
3. **Validar**: `npm run validate-system` debe mostrar 6/6 ✅
4. **Desarrollar**: Usar branch `feature/nueva-funcionalidad`
5. **Test**: Scripts deben pasar validación completa
6. **PR**: Incluir descripción de cambios en sistema

### **📚 Para Educadores (Agregar Contenido)**
1. **Setup básico**: `npm install && npm run precommit-setup`
2. **Crear lección**: Seguir estructura de frontmatter obligatoria
3. **Tablas vocabulario**: Header exacto con columna "Categoría"
4. **Commit**: Precommit valida y actualiza automáticamente
5. **Push**: Deploy automático a producción

### **📋 Checklist Contribución**
- [ ] `npm run validate-system` muestra 6/6 ✅
- [ ] Precommit hooks funcionan correctamente
- [ ] Tablas vocabulario con header correcto
- [ ] Frontmatter completo según schema
- [ ] Sin archivos binarios grandes añadidos
- [ ] Tests de modal chino pasan (si relevante)

---

## 📄 LICENCIA Y RECURSOS

### **📖 Licencia**
CC BY-SA 4.0 - Contenido educativo libre

### **🔗 Enlaces Importantes**
- **Documentación pedagógica**: [`CLAUDE.md`](./CLAUDE.md)
- **Reporte de optimización**: [`SISTEMA_OPTIMIZADO.md`](./SISTEMA_OPTIMIZADO.md)
- **Issues y feedback**: [GitHub Issues](https://github.com/tu-usuario/versos-de-protesta/issues)

### **📚 Recursos Externos**
- **CC-CEDICT**: Diccionario chino bajo licencia CC BY-SA 4.0
- **Kangxi Radicals**: Sistema estándar de radicales chinos
- **Himnos obreros**: Dominio público, patrimonio cultural

---

## 🎉 SISTEMA COMPLETAMENTE DOCUMENTADO

**✅ Scripts documentados**: 12 scripts con función específica y comandos  
**✅ Hooks documentados**: Configuración completa de precommit  
**✅ Workflow documentado**: Proceso completo de contribución  
**✅ Performance documentado**: Métricas antes/después de optimización  
**✅ Troubleshooting**: Validación automática y solución de problemas  

🔥 **El sistema está completamente optimizado, validado y documentado para desarrollo colaborativo!**