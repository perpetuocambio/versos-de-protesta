#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const strokesDir = path.join(__dirname, 'public/data/chinese/strokes');
const characterDataPath = path.join(__dirname, 'public/data/chinese/character-data.json');
const srcDir = path.join(__dirname, 'src');

// URL base de MDBG para GIFs de trazos
const MDBG_BASE_URL = 'https://www.mdbg.net/chinese/strokes/';

// Función para extraer caracteres chinos de un texto
function extractChineseCharacters(text) {
  const chineseRegex = /[\u4e00-\u9fff]/g;
  return [...new Set(text.match(chineseRegex) || [])];
}

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
    console.log('🔍 Analizando archivos del proyecto para encontrar caracteres chinos...');
    
    // Buscar todos los archivos .md y .astro
    const files = await glob('**/*.{md,astro}', { 
      cwd: srcDir,
      ignore: ['node_modules/**', '.git/**']
    });
    
    console.log(`📁 Archivos encontrados: ${files.length}`);
    
    // Extraer todos los caracteres chinos
    const allChineseChars = new Set();
    
    for (const file of files) {
      const filePath = path.join(srcDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const chars = extractChineseCharacters(content);
        chars.forEach(char => allChineseChars.add(char));
      } catch (error) {
        console.log(`⚠️  No se pudo leer ${file}: ${error.message}`);
      }
    }
    
    console.log(`🈳 Total de caracteres chinos únicos encontrados: ${allChineseChars.size}`);
    
    // Leer datos existentes de caracteres (si existe)
    let characterData = { characters: {} };
    if (fs.existsSync(characterDataPath)) {
      characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
      console.log(`📚 Caracteres en datos existentes: ${Object.keys(characterData.characters).length}`);
    }
    
    // Obtener lista de GIFs existentes
    const existingFiles = fs.readdirSync(strokesDir)
      .filter(file => file.endsWith('.gif') || file.endsWith('.svg'))
      .map(file => path.parse(file).name);
    
    const existingUnicodes = new Set(existingFiles);
    console.log(`📊 GIFs existentes: ${existingFiles.length}`);
    
    // Identificar caracteres faltantes
    const missingCharacters = [];
    
    for (const char of allChineseChars) {
      const unicode = char.codePointAt(0);
      const unicodeStr = unicode.toString();
      
      if (!existingUnicodes.has(unicodeStr)) {
        // Buscar información del carácter en los datos existentes
        const charData = characterData.characters[char];
        
        missingCharacters.push({
          char,
          unicode,
          unicodeStr,
          pinyin: charData?.pinyin || '?',
          hasData: !!charData
        });
      }
    }
    
    console.log(`🔍 Caracteres sin GIF: ${missingCharacters.length}`);
    
    if (missingCharacters.length === 0) {
      console.log('✅ Todos los caracteres encontrados ya tienen sus GIFs de trazos.');
      return;
    }
    
    // Mostrar caracteres faltantes agrupados
    const withData = missingCharacters.filter(c => c.hasData);
    const withoutData = missingCharacters.filter(c => !c.hasData);
    
    if (withData.length > 0) {
      console.log('\\n📝 Caracteres con datos que necesitan GIF:');
      withData.forEach(({ char, unicodeStr, pinyin }) => {
        console.log(`  ${char} (${pinyin}) - ${unicodeStr}.gif`);
      });
    }
    
    if (withoutData.length > 0) {
      console.log('\\n❓ Caracteres SIN datos que necesitan GIF:');
      withoutData.forEach(({ char, unicodeStr }) => {
        console.log(`  ${char} (sin datos) - ${unicodeStr}.gif`);
      });
    }
    
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
    
    // Mostrar caracteres que fallaron para revisión manual
    if (failed > 0) {
      console.log(`\\n⚠️  Nota: Los caracteres que fallaron pueden no estar disponibles en MDBG`);
      console.log(`   o pueden requerir descarga manual desde: ${MDBG_BASE_URL}`);
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

if (!fs.existsSync(srcDir)) {
  console.error(`❌ Directorio src no encontrado: ${srcDir}`);
  process.exit(1);
}

// Ejecutar
downloadMissingStrokes();