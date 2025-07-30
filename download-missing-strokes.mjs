#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const strokesDir = path.join(__dirname, 'public/data/chinese/strokes');
const characterDataPath = path.join(__dirname, 'public/data/chinese/character-data.json');

// URL base de MDBG para GIFs de trazos
const MDBG_BASE_URL = 'https://www.mdbg.net/chinese/strokes/';

// Función para descargar un archivo
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Descargado: ${path.basename(filepath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Borrar archivo parcial
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Función principal
async function downloadMissingStrokes() {
  try {
    // Leer datos de caracteres
    const characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
    const characters = characterData.characters;
    
    // Obtener lista de GIFs existentes
    const existingFiles = fs.readdirSync(strokesDir)
      .filter(file => file.endsWith('.gif') || file.endsWith('.svg'))
      .map(file => path.parse(file).name);
    
    const existingUnicodes = new Set(existingFiles);
    
    console.log(`📊 Total de caracteres en datos: ${Object.keys(characters).length}`);
    console.log(`📊 GIFs existentes: ${existingFiles.length}`);
    
    // Identificar caracteres faltantes
    const missingCharacters = [];
    
    for (const [char, data] of Object.entries(characters)) {
      const unicode = data.unicode.toString();
      
      if (!existingUnicodes.has(unicode)) {
        missingCharacters.push({
          char,
          unicode: data.unicode,
          unicodeStr: unicode,
          pinyin: data.pinyin
        });
      }
    }
    
    console.log(`🔍 Caracteres sin GIF: ${missingCharacters.length}`);
    
    if (missingCharacters.length === 0) {
      console.log('✅ Todos los caracteres ya tienen sus GIFs de trazos.');
      return;
    }
    
    // Mostrar caracteres faltantes
    console.log('\\n📝 Caracteres que necesitan descarga:');
    missingCharacters.forEach(({ char, unicodeStr, pinyin }) => {
      console.log(`  ${char} (${pinyin}) - ${unicodeStr}.gif`);
    });
    
    console.log(`\\n🚀 Iniciando descarga de ${missingCharacters.length} GIFs...\\n`);
    
    // Descargar GIFs faltantes
    let downloaded = 0;
    let failed = 0;
    
    for (const { char, unicode, unicodeStr, pinyin } of missingCharacters) {
      const url = `${MDBG_BASE_URL}${unicodeStr}.gif`;
      const filepath = path.join(strokesDir, `${unicodeStr}.gif`);
      
      try {
        await downloadFile(url, filepath);
        downloaded++;
        
        // Pausa pequeña entre descargas para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ Error descargando ${char} (${pinyin}): ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\\n📊 Resumen:`);
    console.log(`  ✅ Descargados exitosamente: ${downloaded}`);
    console.log(`  ❌ Fallos: ${failed}`);
    console.log(`  📁 Directorio: ${strokesDir}`);
    
    if (downloaded > 0) {
      console.log(`\\n🎉 ¡Descarga completada! Los nuevos GIFs están disponibles.`);
    }
    
  } catch (error) {
    console.error('💥 Error en el script:', error.message);
    process.exit(1);
  }
}

// Verificar que el directorio existe
if (!fs.existsSync(strokesDir)) {
  console.error(`❌ Directorio de trazos no encontrado: ${strokesDir}`);
  process.exit(1);
}

if (!fs.existsSync(characterDataPath)) {
  console.error(`❌ Archivo de datos de caracteres no encontrado: ${characterDataPath}`);
  process.exit(1);
}

// Ejecutar
downloadMissingStrokes();