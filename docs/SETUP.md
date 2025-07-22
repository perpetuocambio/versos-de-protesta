# 🔧 Setup Guide - Versos de Protesta

## 📋 Instalación Inicial

### 1. **Clonar Repositorio**
```bash
git clone https://github.com/usuario/versos-de-protesta.git
cd versos-de-protesta
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Pre-commit Hooks (RECOMENDADO)**
```bash
# Instalar pre-commit
pip install pre-commit

# Configurar hooks automáticos
npm run precommit-setup

# Verificar instalación
pre-commit --version
```

## 🔄 Pre-commit vs GitHub Actions

### ✅ **Pre-commit (RECOMENDADO)**
**Ventajas:**
- ✅ Actualiza diccionario ANTES del commit
- ✅ Git history limpio (un commit por lección)
- ✅ Validación inmediata
- ✅ No necesita push extra
- ✅ Funciona offline

**Flujo:**
```bash
# 1. Crear lección
echo "---\ntitle: DÍA 12\n---" > src/content/blog/dia-12-nueva.md

# 2. Commit (pre-commit automático)
git add .
git commit -m "Add day 12"  # ← Pre-commit actualiza diccionario aquí

# 3. Push limpio
git push  # ← Solo deploy, diccionario ya actualizado
```

### ⚠️ **GitHub Actions (ALTERNATIVO)**
**Desventajas:**
- ❌ Commits dobles (tu commit + bot commit)
- ❌ Git history sucio
- ❌ Requiere push para activarse
- ❌ No funciona offline

## 🛠️ Comandos de Desarrollo

### Desarrollo Local
```bash
# Servidor de desarrollo
npm run dev

# Validar lecciones existentes
npm run validate-lessons

# Actualizar diccionario manualmente
npm run update-content
```

### Pre-commit Commands
```bash
# Ejecutar hooks manualmente
pre-commit run --all-files

# Actualizar hooks
pre-commit autoupdate

# Saltarse pre-commit (NO recomendado)
git commit --no-verify -m "mensaje"
```

## 📝 Agregar Nueva Lección

### Método Automático (Pre-commit)

1. **Crear archivo de lección:**
```markdown
---
title: "DÍA XX: Título del Himno"
description: "Análisis del himno..."
pubDate: 2024-01-XX
day: XX
originalSong:
  title: "Título Original"
  artist: "Compositor"
  year: YYYY
  language: "es"
  genre: "anthem"
grammarTopics:
  - "Concepto gramatical 1"
  - "Concepto gramatical 2"
  - "Concepto gramatical 3"
---

# Contenido de la lección...
```

2. **Commit (automático):**
```bash
git add src/content/blog/dia-XX-titulo.md
git commit -m "Add Día XX: Título"
# ↑ Pre-commit automáticamente:
# - Valida estructura del archivo
# - Extrae vocabulario
# - Actualiza diccionario
# - Rechunkea si necesario
# - Incluye cambios en el commit
```

3. **Push:**
```bash
git push
# ↑ GitHub Actions solo hace build y deploy
```

## 🔍 Validaciones Automáticas

### Pre-commit Hooks Activos:

1. **📋 Validación de Estructura:**
   - Frontmatter completo
   - Campos obligatorios
   - Número de día correcto
   - Máximo 4 temas gramaticales

2. **🔄 Actualización de Diccionario:**
   - Extracción de vocabulario
   - Eliminación de duplicados
   - Ordenamiento por idioma
   - Chunking optimizado

3. **🧹 Limpieza:**
   - Formato JSON consistente
   - Eliminación de espacios
   - Validación de sintaxis

## ⚡ Performance y Escalabilidad

### Chunks Automáticos:
- **0-19 lecciones:** 1 chunk por idioma
- **20-39 lecciones:** 2 chunks por idioma
- **40-59 lecciones:** 3 chunks por idioma
- **etc...**

### Estimaciones:
| Lecciones | Tiempo Pre-commit | Tamaño Total | Chunks |
|-----------|------------------|--------------|---------|
| 12 actual | ~5 segundos | 1.6MB | 8 chunks |
| 40 | ~8 segundos | 2.4MB | 16 chunks |
| 100 | ~15 segundos | 6MB | 40 chunks |

## 🆘 Troubleshooting

### Pre-commit No Funciona:
```bash
# Verificar instalación
pre-commit --version

# Reinstalar hooks
pre-commit uninstall
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

### Error de Validación:
```bash
# Ver qué falló
git commit -m "test"  # Verás el error del hook

# Arreglar y reintentar
# ... fix issues ...
git add .
git commit -m "test"  # Debería funcionar ahora
```

### Saltar Pre-commit (Emergencia):
```bash
# Solo para emergencias - NO recomendado
git commit --no-verify -m "emergency commit"

# Luego actualizar diccionario manualmente
npm run update-content
git add src/data/
git commit -m "Update dictionary manually"
```

## 🎯 Flujo Recomendado

```bash
# 1. Instalar pre-commit (una vez)
npm run precommit-setup

# 2. Para cada nueva lección:
vim src/content/blog/dia-XX-titulo.md  # Crear lección
git add .
git commit -m "Add Día XX"  # ← Automático
git push

# 3. ¡Listo! Sitio actualizado automáticamente
```

**🔥 Con pre-commit: Un commit por lección, git history limpio, diccionario siempre actualizado!**