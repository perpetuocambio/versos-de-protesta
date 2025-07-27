#!/usr/bin/env node

// Debug específico para entender por qué 战 no se procesa correctamente

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = __dirname;
const CEDICT_RAW_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'chinese', 'cedict_raw.txt');

// Usar la misma función de parsing que el script principal
function parseCEDICTLine(line) {
  if (line.startsWith('#') || line.trim() === '' || line.startsWith('%')) {
    return null;
  }
  
  const match = line.match(/^(.+?)\s+(.+?)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) {
    return null;
  }
  
  const [, simplified, traditional, pinyin, definitions] = match;
  
  return {
    traditional: simplified.trim(),  // Primer campo = tradicional
    simplified: traditional.trim(),  // Segundo campo = simplificado
    pinyin: pinyin,
    definitions: definitions.split('/').filter(d => d.trim()).map(d => d.trim())
  };
}

// Buscar específicamente entradas que contengan 战
function debugCharacter() {
  console.log('🔍 Buscando entradas que contengan 战...\n');
  
  const content = fs.readFileSync(CEDICT_RAW_FILE, 'utf8');
  const lines = content.split('\n');
  
  let found = 0;
  
  for (const line of lines) {
    if (line.includes('战')) {
      const entry = parseCEDICTLine(line);
      if (entry && found < 10) {
        console.log(`📝 Línea: ${line}`);
        console.log(`   Tradicional: "${entry.traditional}"`);
        console.log(`   Simplificado: "${entry.simplified}"`);
        console.log(`   Pinyin: "${entry.pinyin}"`);
        console.log(`   Definiciones: ${entry.definitions.slice(0, 2).join(', ')}`);
        
        // Verificar posición de 战
        const charIndex = entry.simplified.indexOf('战');
        if (charIndex !== -1) {
          console.log(`   🎯 战 encontrado en posición ${charIndex}`);
          
          const syllables = entry.pinyin.split(/\s+/);
          console.log(`   🔊 Sílabas pinyin: [${syllables.join(', ')}]`);
          console.log(`   📏 Longitud simplificado: ${entry.simplified.length}, sílabas: ${syllables.length}`);
          
          if (syllables.length === entry.simplified.length) {
            console.log(`   ✅ Pinyin para 战: "${syllables[charIndex]}"`);
          } else {
            console.log(`   ⚠️ Desajuste: No se puede extraer pinyin individual`);
          }
        }
        
        console.log('   ' + '─'.repeat(50));
        found++;
      }
    }
  }
  
  console.log(`\n📊 Total entradas con 战 encontradas: ${found}+`);
}

debugCharacter();