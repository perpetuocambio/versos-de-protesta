# ESQUEMA DE BASE DE DATOS PARA MIGRACIÓN PYTHON/SQLITE

## 🎯 OBJETIVO

Migrar la estructura JSON actual a SQLite para:
- **Despliegue en GitHub Pages** (SQLite funciona como archivo estático)
- **Consultas eficientes** en Python
- **Relaciones normalizadas** entre entidades
- **Escalabilidad** para futuras funcionalidades

---

## 📊 ESTRUCTURA ACTUAL JSON → ENTIDADES SQLITE

### **1. TABLA: lessons**
```sql
CREATE TABLE lessons (
    id TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pub_date DATE,
    difficulty_level TEXT,
    estimated_time TEXT,
    content_type TEXT,
    cultural_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. TABLA: songs**
```sql
CREATE TABLE songs (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    year INTEGER,
    language TEXT,
    genre TEXT,
    origin TEXT,
    original_lyrics TEXT,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### **3. TABLA: translations**
```sql
CREATE TABLE translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    title TEXT,
    lyrics TEXT,
    maintains_rhyme BOOLEAN DEFAULT FALSE,
    translation_type TEXT, -- literal, adapted, free
    FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

### **4. TABLA: vocabulary_terms**
```sql
CREATE TABLE vocabulary_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    term TEXT NOT NULL,
    category TEXT, -- political, descriptive, weather, etc.
    difficulty TEXT, -- beginner, intermediate, advanced
    etymology TEXT,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### **5. TABLA: vocabulary_translations**
```sql
CREATE TABLE vocabulary_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id INTEGER NOT NULL,
    language_code TEXT NOT NULL,
    translation TEXT NOT NULL,
    gender TEXT, -- m, f, n
    plural TEXT,
    ipa TEXT, -- pronunciación IPA
    notes TEXT,
    FOREIGN KEY (term_id) REFERENCES vocabulary_terms(id)
);
```

### **6. TABLA: grammar_topics**
```sql
CREATE TABLE grammar_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    examples TEXT, -- JSON o texto estructurado
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### **7. TABLA: historical_context**
```sql
CREATE TABLE historical_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    context_text TEXT NOT NULL,
    key_events TEXT, -- JSON con eventos históricos
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### **8. TABLA: lesson_languages**
```sql
CREATE TABLE lesson_languages (
    lesson_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    PRIMARY KEY (lesson_id, language_code),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### **9. TABLA: lesson_tags**
```sql
CREATE TABLE lesson_tags (
    lesson_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (lesson_id, tag),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

---

## 🔄 SCRIPT DE MIGRACIÓN JSON → SQLITE

```python
import sqlite3
import json
import os
from pathlib import Path

def create_database(db_path):
    """Crear base de datos SQLite con esquema completo"""
    conn = sqlite3.connect(db_path)
    
    # Ejecutar todas las CREATE TABLE statements
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    
    return conn

def migrate_lesson_to_db(lesson_json_path, conn):
    """Migrar una lección JSON a SQLite"""
    with open(lesson_json_path, 'r', encoding='utf-8') as f:
        lesson_data = json.load(f)
    
    # Insertar lesson principal
    conn.execute("""
        INSERT INTO lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        lesson_data['id'],
        lesson_data['metadata']['day'],
        lesson_data['metadata']['title'],
        lesson_data['metadata']['description'],
        lesson_data['metadata']['pubDate'],
        lesson_data['metadata']['difficultyLevel'],
        lesson_data['metadata']['estimatedTime'],
        lesson_data['metadata']['contentType'],
        lesson_data['culturalContext'],
        lesson_data['generated']['migratedAt'],
        lesson_data['generated']['migratedAt']
    ))
    
    # Insertar song
    conn.execute("""
        INSERT INTO songs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        lesson_data['id'] + '_song',
        lesson_data['id'],
        lesson_data['song']['title'],
        lesson_data['song']['artist'],
        lesson_data['song']['year'],
        lesson_data['song']['language'],
        lesson_data['song']['genre'],
        lesson_data['song']['origin'],
        lesson_data['song']['originalLyrics']
    ))
    
    # Insertar translations, vocabulary, etc.
    # ... código para todas las entidades relacionadas
    
    conn.commit()

def main():
    """Migración principal"""
    db_path = 'public/data/lessons.sqlite'
    lessons_dir = Path('public/data/internal/v1/lessons/content')
    
    conn = create_database(db_path)
    
    for lesson_file in lessons_dir.glob('day-*.json'):
        print(f"Migrando: {lesson_file}")
        migrate_lesson_to_db(lesson_file, conn)
    
    conn.close()
    print(f"✅ Base de datos creada: {db_path}")

if __name__ == "__main__":
    main()
```

---

## 🌐 VENTAJAS PARA GITHUB PAGES

1. **SQLite es un archivo estático** → Compatible con GitHub Pages
2. **Consultas SQL eficientes** desde Python/JavaScript
3. **Relaciones normalizadas** → Menos duplicación de datos
4. **Búsquedas complejas** → Filtros por idioma, dificultad, año, etc.
5. **APIs RESTful** → Endpoints dinámicos con Flask/FastAPI

---

## 📁 ESTRUCTURA DE ARCHIVOS FINAL

```
public/
├── data/
│   ├── lessons.sqlite          # Base de datos principal
│   ├── dictionary.sqlite       # Diccionario existente
│   └── api/
│       ├── lessons/
│       ├── songs/
│       └── vocabulary/
└── static/
    └── ... archivos estáticos
```

---

## ✅ ESTADO ACTUAL

- [x] **JSON API completa** creada desde markdown
- [x] **12 lecciones migradas** con contenido preservado
- [x] **Estructura normalizada** diseñada
- [ ] **Script Python** de migración JSON → SQLite
- [ ] **Interfaz web** Python para consultas
- [ ] **Despliegue GitHub Pages** con SQLite

---

## 🎯 PRÓXIMOS PASOS

1. **Implementar script Python** de migración
2. **Crear API REST** con Flask/FastAPI  
3. **Interface web** para explorar lecciones
4. **Configurar GitHub Actions** para deploy automático
5. **Testing** de la estructura completa

La base está **lista** para la migración a Python/SQLite manteniendo compatibilidad con GitHub Pages.