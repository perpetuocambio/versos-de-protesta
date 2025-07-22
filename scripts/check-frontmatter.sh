#!/bin/bash
# Script para verificar frontmatter de lecciones en pre-commit

echo "📋 Checking frontmatter for lesson files..."

exit_code=0

for file in "$@"; do
    echo "🔍 Checking $file..."
    
    # Verificar que el archivo existe
    if [[ ! -f "$file" ]]; then
        echo "❌ File not found: $file"
        exit_code=1
        continue
    fi
    
    # Verificar que tiene frontmatter
    if ! head -n 1 "$file" | grep -q "^---$"; then
        echo "❌ Missing frontmatter start in: $file"
        exit_code=1
        continue
    fi
    
    # Extraer frontmatter
    frontmatter=$(sed -n '2,/^---$/p' "$file" | head -n -1)
    
    # Verificar campos obligatorios
    required_fields=("title:" "day:" "description:" "pubDate:")
    
    for field in "${required_fields[@]}"; do
        if ! echo "$frontmatter" | grep -q "^$field"; then
            echo "❌ Missing required field '$field' in: $file"
            exit_code=1
        fi
    done
    
    # Verificar formato de día
    day_line=$(echo "$frontmatter" | grep "^day:")
    if [[ -n "$day_line" ]]; then
        day_value=$(echo "$day_line" | cut -d':' -f2 | tr -d ' ')
        if ! [[ "$day_value" =~ ^[0-9]+$ ]]; then
            echo "❌ Day field must be a number in: $file (found: '$day_value')"
            exit_code=1
        fi
    fi
    
    # Verificar que grammarTopics no tiene más de 4 elementos
    grammar_section=$(echo "$frontmatter" | sed -n '/^grammarTopics:/,/^[a-zA-Z]/p' | head -n -1)
    if [[ -n "$grammar_section" ]]; then
        topic_count=$(echo "$grammar_section" | grep "^  -" | wc -l)
        if [[ $topic_count -gt 4 ]]; then
            echo "⚠️ Too many grammar topics ($topic_count > 4) in: $file"
            echo "   Consider following CLAUDE.md rule: max 3-4 concepts per day"
        fi
    fi
    
    # Verificar estructura de originalSong si existe
    if echo "$frontmatter" | grep -q "^originalSong:"; then
        song_section=$(echo "$frontmatter" | sed -n '/^originalSong:/,/^[a-zA-Z]/p' | head -n -1)
        
        required_song_fields=("title:" "year:" "language:")
        for field in "${required_song_fields[@]}"; do
            if ! echo "$song_section" | grep -q "^  $field"; then
                echo "❌ Missing originalSong field '$field' in: $file"
                exit_code=1
            fi
        done
    fi
    
    if [[ $exit_code -eq 0 ]]; then
        echo "✅ Frontmatter OK: $file"
    fi
done

if [[ $exit_code -eq 0 ]]; then
    echo "🎉 All frontmatter checks passed!"
else
    echo "💥 Some frontmatter checks failed!"
    echo ""
    echo "💡 Tips:"
    echo "   - Check CLAUDE.md for required frontmatter structure"
    echo "   - Ensure day: field is a number matching filename"
    echo "   - Keep grammarTopics to max 4 items"
    echo "   - Include originalSong with title, year, and language"
fi

exit $exit_code