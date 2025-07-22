#!/usr/bin/env python3
"""
Validador de estructura de lecciones para pre-commit
Verifica que las lecciones tengan la estructura correcta
"""

import sys
import re
import yaml
from pathlib import Path

def validate_lesson_file(file_path):
    """Valida un archivo de lección específico"""
    print(f"🔍 Validating: {file_path}")
    
    try:
        content = Path(file_path).read_text(encoding='utf-8')
        
        # Verificar frontmatter
        frontmatter_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not frontmatter_match:
            print(f"❌ {file_path}: Missing frontmatter")
            return False
            
        try:
            frontmatter = yaml.safe_load(frontmatter_match.group(1))
        except yaml.YAMLError as e:
            print(f"❌ {file_path}: Invalid YAML frontmatter: {e}")
            return False
        
        # Campos obligatorios
        required_fields = ['title', 'day', 'description', 'pubDate']
        missing_fields = [field for field in required_fields if field not in frontmatter]
        
        if missing_fields:
            print(f"❌ {file_path}: Missing required fields: {', '.join(missing_fields)}")
            return False
            
        # Verificar campo day es número
        day = frontmatter.get('day')
        if not isinstance(day, int) or day < 0:
            print(f"❌ {file_path}: 'day' must be a positive integer, got: {day}")
            return False
            
        # Verificar que el número del día coincide con el nombre del archivo
        filename_day_match = re.search(r'dia-(\d+)', file_path)
        if filename_day_match:
            filename_day = int(filename_day_match.group(1))
            if filename_day != day:
                print(f"⚠️ {file_path}: Day number mismatch - filename: {filename_day}, frontmatter: {day}")
        
        # Verificar originalSong si existe
        if 'originalSong' in frontmatter:
            song = frontmatter['originalSong']
            song_required = ['title', 'year', 'language']
            song_missing = [field for field in song_required if field not in song]
            
            if song_missing:
                print(f"❌ {file_path}: Missing originalSong fields: {', '.join(song_missing)}")
                return False
        
        # Verificar grammarTopics
        if 'grammarTopics' in frontmatter:
            topics = frontmatter['grammarTopics']
            if not isinstance(topics, list) or len(topics) > 4:
                print(f"⚠️ {file_path}: grammarTopics should be a list with max 4 items (found {len(topics) if isinstance(topics, list) else 'not a list'})")
        
        # Verificar tablas de vocabulario
        vocab_tables = re.findall(r'\|\s*Español\s*\|.*?Pinyin\s*\|', content)
        if not vocab_tables:
            print(f"⚠️ {file_path}: No vocabulary tables found (should have format: | Español | English [IPA] | ... | Pinyin |)")
        else:
            print(f"✅ {file_path}: Found {len(vocab_tables)} vocabulary table(s)")
        
        print(f"✅ {file_path}: Validation passed")
        return True
        
    except Exception as e:
        print(f"❌ {file_path}: Validation error: {e}")
        return False

def main():
    """Validar todos los archivos pasados como argumentos"""
    if len(sys.argv) < 2:
        print("Usage: python3 validate-lesson.py <file1> [file2] ...")
        sys.exit(1)
    
    files_to_validate = sys.argv[1:]
    all_valid = True
    
    print(f"📋 Validating {len(files_to_validate)} lesson file(s)...")
    
    for file_path in files_to_validate:
        if not validate_lesson_file(file_path):
            all_valid = False
    
    if all_valid:
        print("🎉 All lesson files are valid!")
        sys.exit(0)
    else:
        print("💥 Some lesson files have validation errors!")
        sys.exit(1)

if __name__ == '__main__':
    main()