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

// URLs alternativas para descargar GIFs de trazos
const STROKE_SOURCES = [
  'https://www.mdbg.net/chinese/strokes/',
  'https://stroke-order.learningweb.moe.edu.tw/character/',
];

// Función para verificar si un archivo GIF es válido
function isValidGif(filepath) {
  try {
    const buffer = fs.readFileSync(filepath);
    // Un GIF válido debe empezar con "GIF87a" o "GIF89a"
    const header = buffer.toString('ascii', 0, 6);
    return header === 'GIF87a' || header === 'GIF89a';
  } catch (error) {
    return false;
  }
}

// Función para descargar un archivo con verificación
function downloadFile(url, filepath, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attemptDownload() {
      attempts++;
      const file = fs.createWriteStream(filepath);
      
      const request = https.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            
            // Verificar si el archivo descargado es válido
            if (isValidGif(filepath)) {
              console.log(`✅ Descargado y verificado: ${path.basename(filepath)}`);
              resolve(true);
            } else {
              fs.unlink(filepath, () => {});
              if (attempts < maxRetries) {
                console.log(`⚠️  GIF inválido, reintentando... (${attempts}/${maxRetries})`);
                setTimeout(attemptDownload, 1000);
              } else {
                reject(new Error(`GIF inválido después de ${maxRetries} intentos`));
              }
            }
          });
          
          file.on('error', (err) => {
            fs.unlink(filepath, () => {});
            if (attempts < maxRetries) {
              setTimeout(attemptDownload, 1000);
            } else {
              reject(err);
            }
          });
        } else if (response.statusCode === 404) {
          reject(new Error(`404 - No encontrado: ${url}`));
        } else {
          if (attempts < maxRetries) {
            setTimeout(attemptDownload, 1000);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          }
        }
      }).on('error', (err) => {
        if (attempts < maxRetries) {
          setTimeout(attemptDownload, 1000);
        } else {
          reject(err);
        }
      });
      
      // Timeout de 10 segundos por descarga
      request.setTimeout(10000, () => {
        request.destroy();
        if (attempts < maxRetries) {
          setTimeout(attemptDownload, 1000);
        } else {
          reject(new Error('Timeout en descarga'));
        }
      });
    }
    
    attemptDownload();
  });
}

// Función para limpiar GIFs corruptos existentes
function cleanupCorruptedGifs() {
  console.log('🧹 Limpiando GIFs corruptos...');
  
  const files = fs.readdirSync(strokesDir).filter(f => f.endsWith('.gif'));
  let cleaned = 0;
  
  for (const file of files) {
    const filepath = path.join(strokesDir, file);
    if (!isValidGif(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🗑️  Eliminado GIF corrupto: ${file}`);
      cleaned++;
    }
  }
  
  console.log(`✨ Limpieza completada: ${cleaned} archivos corruptos eliminados`);
  return cleaned;
}

// Función principal
async function fixStrokesDownload() {
  try {
    console.log('🔧 Iniciando reparación de descargas de trazos...\n');
    
    // Paso 1: Limpiar archivos corruptos
    const cleaned = cleanupCorruptedGifs();
    
    // Paso 2: Leer datos de caracteres conocidos
    let characterData = { characters: {} };
    if (fs.existsSync(characterDataPath)) {
      characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
    }
    
    const knownChars = Object.keys(characterData.characters);
    console.log(`\n📚 Caracteres conocidos en datos: ${knownChars.length}`);
    
    // Paso 3: Identificar caracteres que necesitan GIFs
    const existingFiles = fs.readdirSync(strokesDir)
      .filter(file => file.endsWith('.gif'))
      .map(file => path.parse(file).name);
    
    const existingUnicodes = new Set(existingFiles);
    
    const missingChars = knownChars.filter(char => {
      const unicode = char.codePointAt(0).toString();
      return !existingUnicodes.has(unicode);
    });
    
    console.log(`🔍 Caracteres que necesitan descarga: ${missingChars.length}`);
    
    if (missingChars.length === 0) {
      console.log('✅ Todos los caracteres conocidos ya tienen GIFs válidos.');
      return;
    }
    
    // Paso 4: Descargar solo caracteres conocidos
    console.log('\n🚀 Descargando GIFs para caracteres conocidos...\n');
    
    let downloaded = 0;
    let failed = 0;
    
    for (const char of missingChars) {
      const charData = characterData.characters[char];
      const unicode = char.codePointAt(0);
      const unicodeStr = unicode.toString();
      const filepath = path.join(strokesDir, `${unicodeStr}.gif`);
      
      console.log(`Descargando: ${char} (${charData.pinyin}) - ${unicodeStr}.gif`);
      
      // Intentar con la fuente principal (MDBG)
      const url = `${STROKE_SOURCES[0]}${unicodeStr}.gif`;
      
      try {
        await downloadFile(url, filepath);
        downloaded++;
        
        // Pausa entre descargas para ser respetuosos con el servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Error con ${char}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Resumen final:`);
    console.log(`  🧹 GIFs corruptos eliminados: ${cleaned}`);
    console.log(`  ✅ Descargados exitosamente: ${downloaded}`);
    console.log(`  ❌ Fallos: ${failed}`);
    console.log(`  📁 Total GIFs válidos: ${fs.readdirSync(strokesDir).filter(f => f.endsWith('.gif') && isValidGif(path.join(strokesDir, f))).length}`);
    
    if (failed > 0) {
      console.log(`\n⚠️  Nota: ${failed} caracteres no pudieron descargarse.`);
      console.log(`   Esto es normal - no todos los caracteres tienen GIFs disponibles en MDBG.`);
    }
    
    if (downloaded > 0) {
      console.log(`\n🎉 ¡Reparación completada! ${downloaded} nuevos GIFs descargados.`);
    }
    
  } catch (error) {
    console.error('💥 Error en la reparación:', error.message);
    process.exit(1);
  }
}

// Verificaciones
if (!fs.existsSync(strokesDir)) {
  console.error(`❌ Directorio de trazos no encontrado: ${strokesDir}`);
  process.exit(1);
}

// Ejecutar
fixStrokesDownload();