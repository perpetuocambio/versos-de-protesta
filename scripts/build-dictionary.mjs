#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function extractVocabularyFromMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Extraer metadatos del frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    let day = null;
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const dayMatch = frontmatter.match(/day:\s*(\d+)/);
      if (dayMatch) {
        day = parseInt(dayMatch[1]);
      }
    }

    const vocabulary = [];
    
    // Regex mejorada para encontrar tablas de vocabulario multilingües
    // Busca diferentes formatos de tabla con al menos 6 idiomas
    const tableRegexes = [
      // Formato con IPA: | Español | English [IPA] | Deutsch [IPA] |...
      /\|\s*Español\s*\|\s*English\s*\[IPA\]\s*\|\s*Deutsch\s*\[IPA\]\s*\|\s*Português\s*\[IPA\]\s*\|\s*Русский\s*\[IPA\]\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\[IPA\]\s*\|\s*Pinyin\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato simple: | Español | English | Deutsch |...
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*(?:中文\s*)?Pinyin\s*\|\s*(?:\w+\s*\|)?\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato con conceptos: | Concepto | Español | English |...
      /\|\s*Concepto\s*\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*Pinyin\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm
    ];
    
    // Intentar con cada regex hasta encontrar coincidencias
    let allMatches = [];
    for (const regex of tableRegexes) {
      const matches = [...content.matchAll(regex)];
      allMatches.push(...matches);
    }
    
    for (const tableMatch of allMatches) {
      const tableContent = tableMatch[1];
      const rows = tableContent.split('\n').filter(row => 
        row.trim() && 
        row.includes('|') && 
        !row.includes('---') &&
        !row.includes('Español') // Evitar header duplicado
      );
      
      for (const row of rows) {
        const cells = row.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');
        
        // Función para limpiar contenido de celdas
        const cleanCell = (cell) => {
          return cell
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remover markdown bold
            .replace(/\[.*?\]/g, '') // Remover contenido IPA
            .replace(/^\*\*|\*\*$/g, '') // Remover bold al inicio/final
            .trim();
        };

        // Manejar diferentes formatos de tabla
        let entry = null;
        
        if (cells.length >= 9 && cells[0].toLowerCase() !== 'concepto') {
          // Formato con IPA o formato simple con 8+ columnas
          entry = {
            es: cleanCell(cells[0]),
            en: cleanCell(cells[1]), 
            de: cleanCell(cells[2]),
            pt: cleanCell(cells[3]),
            ru: cleanCell(cells[4]),
            ruRom: cleanCell(cells[5]),
            zh: cleanCell(cells[6]),
            zhPinyin: cleanCell(cells[7]),
            source: fileName,
            day: day,
            filePath: filePath
          };
        } else if (cells.length >= 9 && cells[0].toLowerCase() === 'concepto') {
          // Formato con concepto (omitir primera columna)
          entry = {
            es: cleanCell(cells[1]),
            en: cleanCell(cells[2]), 
            de: cleanCell(cells[3]),
            pt: cleanCell(cells[4]),
            ru: cleanCell(cells[5]),
            ruRom: cleanCell(cells[6]),
            zh: cleanCell(cells[7]),
            zhPinyin: cleanCell(cells[8]),
            source: fileName,
            day: day,
            filePath: filePath
          };
        } else if (cells.length >= 8) {
          // Formato simple de 8 columnas
          entry = {
            es: cleanCell(cells[0]),
            en: cleanCell(cells[1]), 
            de: cleanCell(cells[2]),
            pt: cleanCell(cells[3]),
            ru: cleanCell(cells[4]),
            ruRom: cleanCell(cells[5]),
            zh: cleanCell(cells[6]),
            zhPinyin: cleanCell(cells[7]),
            source: fileName,
            day: day,
            filePath: filePath
          };
        }

        // Validar y agregar entrada
        if (entry && entry.es && entry.en && entry.de && entry.pt && entry.ru) {
          vocabulary.push(entry);
        }
      }
    }
    
    return vocabulary;
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
    return [];
  }
}

async function buildDictionary() {
  console.log('🚀 Iniciando construcción del diccionario...');
  
  // Crear directorio de datos si no existe
  const dataDir = path.join(projectRoot, 'src', 'data');
  await fs.mkdir(dataDir, { recursive: true });
  
  // Buscar todos los archivos markdown de lecciones
  const blogDir = path.join(projectRoot, 'src', 'content', 'blog');
  const mdFiles = await fs.readdir(blogDir);
  const lessonFiles = mdFiles.filter(file => 
    file.endsWith('.md') && file.startsWith('dia-')
  );
  
  console.log(`📚 Encontrados ${lessonFiles.length} archivos de lecciones`);
  
  // Extraer vocabulario de todos los archivos
  const allVocabulary = [];
  for (const file of lessonFiles) {
    const filePath = path.join(blogDir, file);
    const vocabulary = await extractVocabularyFromMarkdown(filePath);
    allVocabulary.push(...vocabulary);
    console.log(`   ${file}: ${vocabulary.length} entradas extraídas`);
  }
  
  console.log(`📖 Total de entradas de vocabulario: ${allVocabulary.length}`);
  
  // Organizar por idiomas
  const dictionary = {
    es: new Map(),
    en: new Map(),
    de: new Map(), 
    pt: new Map(),
    ru: new Map(),
    ruRom: new Map(),
    zh: new Map(),
    zhPinyin: new Map()
  };

  // Procesar entradas y agrupar por palabra
  for (const entry of allVocabulary) {
    const languages = ['es', 'en', 'de', 'pt', 'ru', 'ruRom', 'zh', 'zhPinyin'];
    
    for (const lang of languages) {
      const word = entry[lang];
      if (word && word.length > 0) {
        if (!dictionary[lang].has(word)) {
          dictionary[lang].set(word, []);
        }
        dictionary[lang].get(word).push({
          translations: entry,
          source: entry.source,
          day: entry.day,
          filePath: entry.filePath
        });
      }
    }
  }

  // Convertir Maps a Objects y ordenar
  const dictionaryObj = {};
  const sortFunctions = {
    zh: (a, b) => a.localeCompare(b, 'zh-Hans-CN'),
    ru: (a, b) => a.localeCompare(b, 'ru'),
    default: (a, b) => a.localeCompare(b)
  };

  for (const [lang, wordMap] of Object.entries(dictionary)) {
    const sortFn = sortFunctions[lang] || sortFunctions.default;
    const sortedEntries = [...wordMap.entries()].sort(([a], [b]) => sortFn(a, b));
    dictionaryObj[lang] = Object.fromEntries(sortedEntries);
  }

  // Generar estadísticas
  const stats = {
    totalEntries: allVocabulary.length,
    totalUniqueWords: Object.values(dictionaryObj.es).length,
    byLanguage: Object.fromEntries(
      Object.entries(dictionaryObj).map(([lang, words]) => [
        lang,
        Object.keys(words).length
      ])
    ),
    byLesson: {},
    lastUpdated: new Date().toISOString(),
    generatedBy: 'build-dictionary.mjs v1.0'
  };

  // Estadísticas por lección
  for (const entry of allVocabulary) {
    const lessonKey = `Día ${entry.day}`;
    if (!stats.byLesson[lessonKey]) {
      stats.byLesson[lessonKey] = 0;
    }
    stats.byLesson[lessonKey]++;
  }

  // Guardar archivos
  const dictionaryPath = path.join(dataDir, 'dictionary.json');
  const statsPath = path.join(dataDir, 'dictionary-stats.json');
  
  await fs.writeFile(
    dictionaryPath,
    JSON.stringify(dictionaryObj, null, 2),
    'utf-8'
  );
  
  await fs.writeFile(
    statsPath,
    JSON.stringify(stats, null, 2), 
    'utf-8'
  );

  console.log('✅ Diccionario construido exitosamente');
  console.log(`   📁 Guardado en: ${dictionaryPath}`);
  console.log(`   📊 Estadísticas en: ${statsPath}`);
  console.log(`   🔤 Palabras únicas en español: ${Object.keys(dictionaryObj.es).length}`);
  console.log(`   🇨🇳 Caracteres chinos únicos: ${Object.keys(dictionaryObj.zh).length}`);
  console.log(`   🇷🇺 Palabras rusas únicas: ${Object.keys(dictionaryObj.ru).length}`);
  
  return { dictionary: dictionaryObj, stats };
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  buildDictionary().catch(console.error);
}

export { buildDictionary };