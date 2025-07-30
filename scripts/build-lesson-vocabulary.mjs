#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * SCRIPT SIMPLIFICADO PARA CONSTRUCCIÓN DE VOCABULARIO
 * 
 * REEMPLAZA:
 * - build-dictionary.mjs (555 líneas)
 * - partition-dictionary.mjs (264 líneas)  
 * - chunk-dictionary-for-scale.mjs (268 líneas)
 * - migrate-to-internal-structure.mjs
 * 
 * TOTAL: ~1,100+ líneas → ~200 líneas (80% reducción)
 * 
 * FUNCIONALIDAD MANTENIDA 100%:
 * - Extracción vocabulario desde tablas MD
 * - Validación multiidioma
 * - Consolidación por lecciones
 * - Datos chinos extendidos
 * - Categorización gramatical
 */

// Sílabas pinyin válidas para validación
const pinyinSyllableSet = new Set([
  'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
  'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'bie', 'biao', 'bian', 'bin', 'bing', 'bu',
  'pa', 'po', 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng', 'pi', 'pie', 'piao', 'pian', 'pin', 'ping', 'pu',
  'ma', 'mo', 'me', 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng', 'mi', 'mie', 'miao', 'miu', 'mian', 'min', 'ming', 'mu',
  'fa', 'fo', 'fei', 'fou', 'fan', 'fen', 'fang', 'feng',
  'da', 'de', 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng', 'dong', 'di', 'die', 'diao', 'diu', 'dian', 'ding', 'du', 'duo', 'dui', 'duan', 'dun',
  'ta', 'te', 'tai', 'tao', 'tou', 'tan', 'tang', 'teng', 'tong', 'ti', 'tie', 'tiao', 'tian', 'ting', 'tu', 'tuo', 'tui', 'tuan', 'tun',
  'la', 'lo', 'le', 'lai', 'lei', 'lao', 'lou', 'lan', 'lang', 'leng', 'long', 'li', 'lia', 'lie', 'liao', 'liu', 'lian', 'lin', 'liang', 'ling', 'lu', 'luo', 'luan', 'lun', 'lü', 'lüe',
  'yi', 'ya', 'ye', 'yao', 'you', 'yan', 'yin', 'yang', 'ying', 'yong', 'wu', 'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'yu', 'yue', 'yuan', 'yun'
]);

function segmentPinyin(pinyin) {
  if (!pinyin || pinyin.includes(' ')) return pinyin;

  const result = [];
  let i = 0;
  while (i < pinyin.length) {
    let longestMatch = '';
    for (let j = i; j < pinyin.length; j++) {
      const sub = pinyin.substring(i, j + 1);
      const normalizedSub = sub.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[üÜ]/g, 'v');
      if (pinyinSyllableSet.has(normalizedSub)) {
        longestMatch = sub;
      }
    }

    if (longestMatch) {
      result.push(longestMatch);
      i += longestMatch.length;
    } else {
      console.warn(`⚠️ No se pudo segmentar pinyin: "${pinyin}" en "${pinyin.substring(i)}"`);
      return pinyin;
    }
  }
  return result.join(' ');
}

function isWordInLanguage(word, lang) {
  const patterns = {
    es: /^[a-záéíóúüñ\s\-']+$/i,
    en: /^[a-z\s\-']+$/i, 
    de: /^[a-zäöüß\s\-']+$/i,
    pt: /^[a-záàâãéêíóôõú\s\-']+$/i,
    ru: /^[а-яё\s\-']+$/i,
    ruRom: /^[a-záéíóúý\s\-'']+$/i,
    zh: /^[\u4e00-\u9fff\s]+$/,
    zhPinyin: /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\-']+$/i
  };
  
  return patterns[lang]?.test(word) ?? true;
}

async function extractVocabularyFromMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Extraer metadatos del frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    let day = null, title = '';
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const dayMatch = frontmatter.match(/day:\s*(\d+)/);
      const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
      if (dayMatch) day = parseInt(dayMatch[1]);
      if (titleMatch) title = titleMatch[1];
    }

    const vocabulary = [];
    
    // Regex para tablas de vocabulario legítimas
    const tableRegexes = [
      // Formato EXTENDIDO: | Español | English | ... | Pinyin | Trazos | Radical | Estructura | Categoría |
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*Pinyin\s*\|\s*Trazos\s*\|\s*Radical\s*\|\s*Estructura\s*\|\s*Categoría\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato PREFERIDO: | Español | English | ... | Pinyin | Categoría |
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Portuguese\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*(?:中文\s*)?Pinyin\s*\|\s*Categoría\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato simple: | Español | English | ... | Pinyin |
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*(?:中文\s*)?Pinyin\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm
    ];

    // Filtrar tablas no-vocabulario
    const excludedPatterns = [
      /\|\s*Región\s*\|/i, /\|\s*Concepto\s*\|/i, /\|\s*Elemento\s*\|/i,
      /\|\s*Año\s*\|/i, /CONJUGACIÓN.*COMPLETA/i, /TRADICIONES.*MUSICALES/i
    ];
    
    for (const regex of tableRegexes) {
      const matches = [...content.matchAll(regex)];
      const validMatches = matches.filter(match => {
        const fullMatch = match[0];
        return !excludedPatterns.some(pattern => pattern.test(fullMatch));
      });
      
      for (const tableMatch of validMatches) {
        const tableContent = tableMatch[1];
        const rows = tableContent.split('\n').filter(row => 
          row.trim() && row.includes('|') && !row.includes('---') && !row.includes('Español')
        );
        
        for (const row of rows) {
          const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
          
          if (cells.length < 8) continue; // Mínimo 8 columnas (8 idiomas)
          
          // Limpiar contenido de celdas
          const cleanCell = (cell) => cell
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\[.*?\]/g, '')
            .trim();

          // Detectar formato de tabla
          const header = tableMatch[0].split('\n')[0];
          const hasChineseColumns = /Trazos\s*\|\s*Radical\s*\|\s*Estructura/i.test(header);
          const hasCategoryColumn = /Categoría/i.test(header);
          
          let entry = null;
          
          if (cells.length >= 12 && hasChineseColumns && hasCategoryColumn) {
            // Formato EXTENDIDO con información china
            entry = {
              es: cleanCell(cells[0]),
              en: cleanCell(cells[1]), 
              de: cleanCell(cells[2]),
              pt: cleanCell(cells[3]),
              ru: cleanCell(cells[4]),
              ruRom: cleanCell(cells[5]),
              zh: cleanCell(cells[6]),
              zhPinyin: segmentPinyin(cleanCell(cells[7])),
              zhStrokes: cleanCell(cells[8]),
              zhRadical: cleanCell(cells[9]),
              zhStructure: cleanCell(cells[10]),
              category: cleanCell(cells[11])
            };
          } else if (cells.length >= 9 && hasCategoryColumn) {
            // Formato PREFERIDO con categoría
            entry = {
              es: cleanCell(cells[0]),
              en: cleanCell(cells[1]), 
              de: cleanCell(cells[2]),
              pt: cleanCell(cells[3]),
              ru: cleanCell(cells[4]),
              ruRom: cleanCell(cells[5]),
              zh: cleanCell(cells[6]),
              zhPinyin: segmentPinyin(cleanCell(cells[7])),
              category: cleanCell(cells[8])
            };
          } else if (cells.length >= 8) {
            // Formato simple sin categoría
            entry = {
              es: cleanCell(cells[0]),
              en: cleanCell(cells[1]), 
              de: cleanCell(cells[2]),
              pt: cleanCell(cells[3]),
              ru: cleanCell(cells[4]),
              ruRom: cleanCell(cells[5]),
              zh: cleanCell(cells[6]),
              zhPinyin: segmentPinyin(cleanCell(cells[7])),
              category: 'sustantivo' // por defecto
            };
          }

          // Validar entrada
          if (entry && entry.es && entry.en && entry.de && entry.pt && entry.ru) {
            // Verificar que sea vocabulario real
            const isValidVocabulary = 
              entry.es.length > 1 && entry.en.length > 1 &&
              !/\d/.test(entry.es) && !/\d/.test(entry.en) &&
              entry.es.toLowerCase() !== entry.en.toLowerCase();
            
            // Validar idiomas
            const languageValidation = 
              isWordInLanguage(entry.es, 'es') &&
              isWordInLanguage(entry.en, 'en') &&
              isWordInLanguage(entry.de, 'de') &&
              isWordInLanguage(entry.pt, 'pt') &&
              isWordInLanguage(entry.ru, 'ru') &&
              (entry.ruRom ? isWordInLanguage(entry.ruRom, 'ruRom') : true) &&  
              (entry.zh ? isWordInLanguage(entry.zh, 'zh') : true) &&
              (entry.zhPinyin ? isWordInLanguage(entry.zhPinyin, 'zhPinyin') : true);
            
            if (isValidVocabulary && languageValidation) {
              vocabulary.push({
                ...entry,
                source: fileName,
                day: day,
                title: title,
                filePath: path.relative(projectRoot, filePath)
              });
            }
          }
        }
      }
    }
    
    return vocabulary;
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
    return [];
  }
}

async function buildLessonVocabulary() {
  console.log('🚀 Construyendo vocabulario de lecciones (SIMPLIFICADO)...');
  
  try {
    // Crear directorio de datos
    const dataDir = path.join(projectRoot, 'public', 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Buscar archivos de lecciones
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
    
    // Consolidar entradas duplicadas
    const wordsMap = new Map();
    
    for (const entry of allVocabulary) {
      const key = `${entry.es}-${entry.en}`;
      
      if (wordsMap.has(key)) {
        // Consolidar lecciones
        const existing = wordsMap.get(key);
        if (!existing.lessons.includes(entry.day)) {
          existing.lessons.push(entry.day);
        }
      } else {
        // Nueva entrada
        wordsMap.set(key, {
          id: key.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
          ...entry,
          lessons: [entry.day],
          frequency: 1,
          firstAppearance: entry.day
        });
      }
    }
    
    // Convertir a array y ordenar
    const consolidatedWords = Array.from(wordsMap.values())
      .sort((a, b) => a.firstAppearance - b.firstAppearance);
    
    // Actualizar frecuencias
    consolidatedWords.forEach(word => {
      word.frequency = word.lessons.length;
    });
    
    // Crear estructura final
    const lessonWordsData = {
      meta: {
        totalWords: consolidatedWords.length,
        totalLessons: lessonFiles.length,
        languages: ['es', 'en', 'de', 'pt', 'ru', 'ruRom', 'zh', 'zhPinyin'],
        lastUpdated: new Date().toISOString(),
        generatedBy: 'build-lesson-vocabulary.mjs v1.0'
      },
      words: consolidatedWords
    };
    
    // Guardar archivo único
    const outputPath = path.join(dataDir, 'lesson-words.json');
    await fs.writeFile(
      outputPath,
      JSON.stringify(lessonWordsData, null, 2),
      'utf-8'
    );
    
    console.log('✅ Vocabulario de lecciones construido exitosamente');
    console.log(`   📁 Guardado en: ${outputPath}`);
    console.log(`   🔤 Palabras únicas: ${consolidatedWords.length}`);
    console.log(`   📚 Lecciones procesadas: ${lessonFiles.length}`);
    console.log(`   🈳 Caracteres chinos: ${consolidatedWords.filter(w => w.zh).length}`);
    console.log(`   🔄 Promedio apariciones: ${(consolidatedWords.reduce((sum, w) => sum + w.frequency, 0) / consolidatedWords.length).toFixed(1)}`);
    
    return lessonWordsData;
  } catch (error) {
    console.error('❌ Error construyendo vocabulario:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  buildLessonVocabulary().catch(console.error);
}

export { buildLessonVocabulary };