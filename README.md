# 🚩 Versos de Protesta

> Diccionario multilingüe de himnos obreros con análisis gramatical comparativo

## 🎯 Descripción

Proyecto educativo que usa himnos revolucionarios históricos como base para el aprendizaje de idiomas, con análisis gramatical comparativo en 8 idiomas: Español, English, Deutsch, Português, Русский, Русский Rom., 中文, y Pinyin.

## 🏗️ Arquitectura Técnica

- **Framework**: Astro 5.12+ con content collections
- **Diccionario**: Sistema de chunks escalable para 100+ lecciones
- **Performance**: Carga bajo demanda, ~50ms por chunk
- **Deployment**: GitHub Pages con workflow automatizado

## 🔄 Workflow Automatizado

### ✅ Al Agregar Nueva Lección:

1. **Crear archivo**: `src/content/blog/dia-XX-titulo.md`
2. **Push a main**: Los workflows automáticamente:
   - Extraen vocabulario del nuevo archivo
   - Actualizan diccionario sin duplicados
   - Rechunkean optimalmente
   - Rebuild y deploy del sitio

### 🤖 Workflows Disponibles:

- **`update-dictionary.yml`**: Actualiza diccionario en nuevas lecciones
- **`build-and-deploy.yml`**: Build y deploy a GitHub Pages  
- **`pr-dictionary-check.yml`**: Validación en Pull Requests

## 📊 Escalabilidad

| Lecciones | Chunks por Idioma | Tamaño Total | Tiempo Carga |
|-----------|------------------|--------------|--------------|
| 12 (actual) | 1 chunk | 200KB | 50ms |
| 40 | 2 chunks | 300KB | 100ms |
| 100 | 5 chunks | 750KB | 250ms |

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Actualizar diccionario manualmente
npm run update-content

# Build completo
npm run build

# Solo migración interna
npm run internal-migrate
```

## 📁 Estructura del Proyecto

```
src/
├── content/blog/          # Lecciones (.md)
├── data/
│   ├── internal/          # Diccionario interno (no expuesto)
│   │   └── v1/dictionary/
│   │       ├── chunks/    # Chunks por rango de lecciones
│   │       └── languages/ # Índices por idioma
│   └── dictionary-stats.json
├── pages/
├── components/
└── utils/
    └── dictionary-chunks.js  # Cliente optimizado
```

## 🎵 Agregar Nueva Lección

### 1. Crear Archivo

```markdown
---
title: "DÍA XX: Título del Himno"
description: "Descripción del análisis"
pubDate: 2024-01-XX
day: XX
originalSong:
  title: "Título Original"
  artist: "Compositor"
  year: YYYY
  language: "es"
  genre: "anthem"
grammarTopics:
  - "Concepto 1"
  - "Concepto 2"
  - "Concepto 3"
---
```

### 2. Incluir Tablas Obligatorias

```markdown
## 📊 VOCABULARIO HISTÓRICO-SOCIAL

| Español | English [IPA] | Deutsch [IPA] | Português [IPA] | Русский [IPA] | Русский Rom. | 中文 [IPA] | Pinyin |
|---------|-----------|-----------|-----------|-----------|---------|-----------|-----------|
| palabra | word [wɜrd] | Wort [vɔrt] | palavra [paˈlavɾa] | слово [ˈslovə] | slovo | 词 [tsi˥˥] | cí |
```

### 3. Push y Automatización

El sistema automáticamente procesa el vocabulario y actualiza toda la estructura.

## 🔧 Metodología Pedagógica

- **CERO ejercicios**: Solo documentación de consulta
- **Máximo 3-4 conceptos** gramaticales por día
- **Progresión sistemática**: De fundamentos básicos a avanzados
- **Música como base cultural**: Himnos históricos auténticos
- **8 idiomas paralelos**: Comparación sistemática

## 📈 Métricas de Éxito

- **Escalabilidad**: Listo para 100+ lecciones
- **Performance**: <250ms para cargar vocabulario completo
- **Mantenimiento**: Automatización completa del diccionario
- **Accuracy**: Sin duplicados, ordenamiento correcto por idioma

## ⚡ Configuración Rápida

```bash
# 1. Instalar
npm install && npm run precommit-setup

# 2. Crear lección
vim src/content/blog/dia-XX-titulo.md

# 3. Commit automático
git add . && git commit -m "Add Día XX"  # ← Pre-commit actualiza todo

# 4. Push
git push  # ← Deploy automático
```

## 🤝 Contribuir

1. **Setup**: `npm install && npm run precommit-setup`
2. **Fork** y crear rama: `git checkout -b nueva-leccion-XX`
3. **Agregar lección** con estructura obligatoria
4. **Commit**: Pre-commit valida y actualiza diccionario automáticamente
5. **PR**: Validación adicional en CI
6. **Merge**: Deploy automático

**📖 Guía completa**: [`docs/SETUP.md`](./docs/SETUP.md)

## 📄 Licencia

CC BY-SA 4.0 - Contenido educativo libre

---

🔥 **El diccionario se actualiza automáticamente** - solo agrega contenido y push!
