#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pinyinSyllableSet = new Set([
    'a', 'o', 'e', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong',
    'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'bie', 'biao', 'bian', 'bin', 'bing', 'bu',
    'pa', 'po', 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng', 'pi', 'pie', 'piao', 'pian', 'pin', 'ping', 'pu',
    'ma', 'mo', 'me', 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng', 'mi', 'mie', 'miao', 'miu', 'mian', 'min', 'ming', 'mu',
    'fa', 'fo', 'fei', 'fou', 'fan', 'fen', 'fang', 'feng',
    'da', 'de', 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng', 'dong', 'di', 'die', 'diao', 'diu', 'dian', 'ding', 'du', 'duo', 'dui', 'duan', 'dun',
    'ta', 'te', 'tai', 'tao', 'tou', 'tan', 'tang', 'teng', 'tong', 'ti', 'tie', 'tiao', 'tian', 'ting', 'tu', 'tuo', 'tui', 'tuan', 'tun',
    'na', 'ne', 'nai', 'nei', 'nao', 'nou', 'nan', 'nen', 'nang', 'neng', 'nong', 'ni', 'nie', 'niao', 'niu', 'nian', 'nin', 'niang', 'ning', 'nu', 'nuo', 'nuan', 'nü', 'nüe',
    'la', 'lo', 'le', 'lai', 'lei', 'lao', 'lou', 'lan', 'lang', 'leng', 'long', 'li', 'lia', 'lie', 'liao', 'liu', 'lian', 'lin', 'liang', 'ling', 'lu', 'luo', 'luan', 'lun', 'lü', 'lüe',
    'ga', 'ge', 'gai', 'gei', 'gao', 'gou', 'gan', 'gen', 'gang', 'geng', 'gong', 'gu', 'gua', 'guo', 'guai', 'gui', 'guan', 'gun', 'guang',
    'ka', 'ke', 'kai', 'kei', 'kao', 'kou', 'kan', 'ken', 'kang', 'keng', 'kong', 'ku', 'kua', 'kuo', 'kuai', 'kui', 'kuan', 'kun', 'kuang',
    'ha', 'he', 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng', 'hong', 'hu', 'hua', 'huo', 'huai', 'hui', 'huan', 'hun', 'huang',
    'ji', 'jia', 'jie', 'jiao', 'jiu', 'jian', 'jin', 'jiang', 'jing', 'jiong', 'ju', 'jue', 'juan', 'jun',
    'qi', 'qia', 'qie', 'qiao', 'qiu', 'qian', 'qin', 'qiang', 'qing', 'qiong', 'qu', 'que', 'quan', 'qun',
    'xi', 'xia', 'xie', 'xiao', 'xiu', 'xian', 'xin', 'xiang', 'xing', 'xiong', 'xu', 'xue', 'xuan', 'xun',
    'zhi', 'zha', 'zhe', 'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhang', 'zheng', 'zhong', 'zhu', 'zhua', 'zhuo', 'zhuai', 'zhui', 'zhuan', 'zhun', 'zhuang',
    'chi', 'cha', 'che', 'chai', 'chao', 'chou', 'chan', 'chen', 'chang', 'cheng', 'chong', 'chu', 'chua', 'chuo', 'chuai', 'chui', 'chuan', 'chun', 'chuang',
    'shi', 'sha', 'she', 'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shang', 'sheng', 'shu', 'shua', 'shuo', 'shuai', 'shui', 'shuan', 'shun', 'shuang',
    'ri', 're', 'rao', 'rou', 'ran', 'ren', 'rang', 'reng', 'rong', 'ru', 'rua', 'ruo', 'rui', 'ruan', 'run',
    'zi', 'za', 'ze', 'zei', 'zao', 'zou', 'zan', 'zen', 'zang', 'zeng', 'zong', 'zu', 'zuo', 'zui', 'zuan', 'zun',
    'ci', 'ca', 'ce', 'cai', 'cao', 'cou', 'can', 'cen', 'cang', 'ceng', 'cong', 'cu', 'cuo', 'cui', 'cuan', 'cun',
    'si', 'sa', 'se', 'sai', 'sao', 'sou', 'san', 'sen', 'sang', 'seng', 'song', 'su', 'suo', 'sui', 'suan', 'sun',
    'yi', 'ya', 'ye', 'yao', 'you', 'yan', 'yin', 'yang', 'ying', 'yong', 'wu', 'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'yu', 'yue', 'yuan', 'yun'
]);

function segmentPinyin(pinyin) {
    if (!pinyin || pinyin.includes(' ')) {
        return pinyin;
    }

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
            console.warn(`   ⚠️ Could not segment pinyin: "${pinyin}" at substring "${pinyin.substring(i)}". Returning original.`);
            return pinyin;
        }
    }
    return result.join(' ');
}


// Función para determinar si una palabra pertenece a un idioma específico
function isWordInLanguage(word, lang) {
  switch (lang) {
    case 'es':
      // Español: caracteres latinos, acentos españoles, ñ
      return /^[a-záéíóúüñ\s\-']+$/i.test(word);
    case 'en': 
      // Inglés: solo caracteres latinos básicos
      return /^[a-z\s\-']+$/i.test(word);
    case 'de':
      // Alemán: caracteres latinos + umlauts (ä, ö, ü, ß)
      return /^[a-zäöüß\s\-']+$/i.test(word);
    case 'pt':
      // Portugués: caracteres latinos + acentos portugueses
      return /^[a-záàâãéêíóôõú\s\-']+$/i.test(word);
    case 'ru':
      // Ruso: solo caracteres cirílicos
      return /^[а-яё\s\-']+$/i.test(word);
    case 'ruRom':
      // Ruso romanizado: caracteres latinos + acentos + apostrofes + espacios
      return /^[a-záéíóúý\s\-'']+$/i.test(word);
    case 'zh':
      // Chino: solo caracteres hanzi (CJK)
      return /^[\u4e00-\u9fff\s]+$/.test(word);
    case 'zhPinyin':
      // Pinyin: caracteres latinos + tonos + MÚLTIPLES PALABRAS
      return /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\-']+$/i.test(word);
    default:
      return true;
  }
}

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
    
    // SOLO procesar tablas de vocabulario legítimas
    const tableRegexes = [
      // Formato EXTENDIDO con información china (12 columnas)
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*Pinyin\s*\|\s*Trazos\s*\|\s*Radical\s*\|\s*Estructura\s*\|\s*Categoría\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato PREFERIDO con 9 columnas (incluyendo Categoría)
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*(?:中文\s*)?Pinyin\s*\|\s*Categoría\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato con IPA: | Español | English [IPA] | ... (8 columnas exactas)
      /\|\s*Español\s*\|\s*English\s*\[IPA\]\s*\|\s*Deutsch\s*\[IPA\]\s*\|\s*Português\s*\[IPA\]\s*\|\s*Русский\s*\[IPA\]\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\[IPA\]\s*\|\s*Pinyin\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm,
      
      // Formato simple con exactamente 8 columnas de idiomas
      /\|\s*Español\s*\|\s*English\s*\|\s*Deutsch\s*\|\s*Português\s*\|\s*Русский\s*\|\s*Русский Rom\.?\s*\|\s*中文\s*\|\s*(?:中文\s*)?Pinyin\s*\|\s*\n\|[\s\S]*?\n((?:\|.*?\n)*)/gm
    ];

    const excludedTablePatterns = [
      // Tablas con información conceptual/regional - versión más flexible
      /\|\s*Región\s*\|/i,
      /\|\s*Concepto\s*\|/i,
      /\|\s*Elemento\s*\|/i,
      /\|\s*Año\s*\|/i,
      /\|\s*Fecha\s*\|/i,
      /\|\s*Periodo\s*\|/i,
      /\|\s*Estructura\s*\|/i,
      /\|\s*Orden\s*\|/i,
      /\|\s*País\s*\|/i,
      /\|\s*Tradición\s*\|/i,
      /\|\s*Característica\s*\|/i,
      // Patrones adicionales para detectar tablas metadata
      /TRADICIONES\s+MUSICALES\s+OBRERAS/i,
      /CARACTERÍSTICAS\s+MUSICALES/i,
      /EXPRESAR.*?EN\s+\d+\s+IDIOMAS/i,
      /SISTEMAS\s+GRAMATICALES/i,
      /SISTEMAS\s+PRONOMINALES/i,
      /SISTEMAS\s+VERBALES/i,
      /ELEMENTOS\s+GRAMATICALES/i,
      /COMPARACIÓN\s+BÁSICA/i,
      /GÉNEROS\s+MUSICALES/i,
      /SINTAXIS\s+COMPARATIVA/i
    ];
    
    // Intentar con cada regex hasta encontrar coincidencias
    let allMatches = [];
    for (const regex of tableRegexes) {
      const matches = [...content.matchAll(regex)];
      // Filtrar matches verificando el contexto completo
      const validMatches = matches.filter(match => {
        const fullMatch = match[0];
        const matchIndex = match.index;
        
        // Extraer contexto anterior (300 caracteres) para buscar headers problemáticos
        const contextBefore = content.substring(Math.max(0, matchIndex - 300), matchIndex);
        
        // Verificar si está precedido por headers problemáticos
        const hasProblematicHeader = [
          /\|\s*Región\s*\|/i,
          /\|\s*Concepto\s*\|/i, 
          /\|\s*Elemento\s*\|/i,
          /\|\s*Año\s*\|\s*Evento\s*\|/i,
          /TRADICIONES.*MUSICALES/i,
          /CARACTERÍSTICAS.*MUSICALES/i,
          /CONJUGACIÓN.*COMPLETA/i,
          /CONJUGAÇÃO.*COMPLETA/i,
          /VERBO.*CONJUGAR/i
        ].some(pattern => pattern.test(contextBefore));
        
        // Verificar si el contenido de la tabla contiene formas conjugadas
        const hasConjugationContent = fullMatch.includes('cantáis') || 
                                    fullMatch.includes('cantamos') || 
                                    fullMatch.includes('cantan') ||
                                    fullMatch.includes('1ª sing') ||
                                    fullMatch.includes('2ª pl') ||
                                    fullMatch.includes('3ª pl');
        
        // También verificar el contenido de la tabla
        const hasProblematicContent = excludedTablePatterns.some(excludePattern => 
          excludePattern.test(fullMatch)
        );
        
        // EXCEPCIÓN: Las tablas de vocabulario con columnas chinas son SIEMPRE válidas
        const isChineseVocabularyTable = /Trazos\s*\|\s*Radical\s*\|\s*Estructura\s*\|\s*Categoría/.test(fullMatch);
        const isStandardVocabularyTable = /TÉRMINOS\s+(CLAVE|POLÍTICOS|HISTÓRICOS)/i.test(contextBefore);
        
        const isLegitimateVocabulary = isChineseVocabularyTable || isStandardVocabularyTable;
        
        const isExcluded = !isLegitimateVocabulary && (hasProblematicHeader || hasProblematicContent || hasConjugationContent);
        
        if (isExcluded) {
          console.log(`   🚫 Tabla excluida - header/contexto problemático: ${fullMatch.split('\n')[0]}`);
        } else if (isLegitimateVocabulary) {
          console.log(`   ✅ Tabla vocabulario aceptada: ${fullMatch.split('\n')[0].substring(0, 100)}...`);
        }
        
        return !isExcluded;
      });
      allMatches.push(...validMatches);
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

        // Función para detectar contenido no-vocabulario
        const isNonVocabularyContent = (text) => {
          const nonVocabPatterns = [
            /^\d{4}-\d{4}$/, // Rangos de años: 1840-1945
            /^\d{4}-presente$/, // Fechas hasta presente: 1840-presente
            /^(Art|Sust|Part|Adv|Fut|Prep|N|V)($|\s|\+)/, // Estructuras gramaticales
            /^SVO$|^SOV$/, // Órdenes sintácticos
            /^[A-Z]{2,}$/, // Abreviaciones
            /^\d+ª\s+(sing|plur|pers)/, // Formas gramaticales
            /^(Periodo|Tradición|Función|Región|Estructura|Orden|Concepto|Elemento|País|Año|Evento|Fecha)/i, // Conceptos descriptivos
            /^(himnos|canciones|resistencia|protestas|fados|coplas|spirituals)/i, // Descripciones históricas
            /,\s*(himnos|canciones|resistencia|protestas)/i, // Listas descriptivas
            /^(Presente|Pretérito|Imperfecto|Futuro|Pasado|Perfecto|Condicional|Subjuntivo)/i, // Tiempos verbales
            /^(yo|tú|él|ella|nosotros|vosotros|ellos|ellas|I|you|he|she|we|they|ich|du|er|sie|wir|ihr)/i, // Pronombres
            /\(.+\)/, // Contenido entre paréntesis
            /\d{4}/, // Años
            /\d+%/, // Porcentajes
            /\d+\.\d+/, // Números con decimales
            /\s(y|e|o|u|a|en|de|el|la|los|las|con|por|para|sin|sobre|tras)\s/i, // Palabras conectoras comunes
            /\w+\s+\w+\s+\w+/ // Más de dos palabras
          ];
          
          return nonVocabPatterns.some(pattern => pattern.test(text.trim()));
        };

        // Manejar diferentes formatos de tabla
        let entry = null;
        const header = tableMatch[0].split('\n')[0];
        const hasCategoryColumn = /Categoría/i.test(header);
        const hasChineseColumns = /Trazos\s*\|\s*Radical\s*\|\s*Estructura/i.test(header);

        if (cells.length >= 12 && hasChineseColumns && hasCategoryColumn) {
          // Formato EXTENDIDO: | Español | English | ... | Pinyin | Trazos | Radical | Estructura | Categoría |
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
            grammaticalCategory: cleanCell(cells[11]),
            source: fileName,
            day: day,
            filePath: path.relative(projectRoot, filePath)
          };
        } else if (cells.length >= 9 && hasCategoryColumn) {
          // Formato PREFERIDO: | Español | English | ... | Categoría |
          entry = {
            es: cleanCell(cells[0]),
            en: cleanCell(cells[1]), 
            de: cleanCell(cells[2]),
            pt: cleanCell(cells[3]),
            ru: cleanCell(cells[4]),
            ruRom: cleanCell(cells[5]),
            zh: cleanCell(cells[6]),
            zhPinyin: segmentPinyin(cleanCell(cells[7])),
            grammaticalCategory: cleanCell(cells[8]),
            source: fileName,
            day: day,
            filePath: path.relative(projectRoot, filePath)
          };
        } else if (cells.length >= 10 && cells[0].match(/^\d{4}$/)) {
            // Formato: | Año | Evento | Español | ...
            entry = {
              es: cleanCell(cells[2]),
              en: cleanCell(cells[3]), 
              de: cleanCell(cells[4]),
              pt: cleanCell(cells[5]),
              ru: cleanCell(cells[6]),
              ruRom: cleanCell(cells[7]),
              zh: cleanCell(cells[8]),
              zhPinyin: cleanCell(cells[9]),
              grammaticalCategory: 'término histórico',
              source: fileName,
              day: day,
              filePath: path.relative(projectRoot, filePath),
              originalKey: cleanCell(cells[0]),
              context: cleanCell(cells[1])
            };
        } else if (cells.length >= 8) {
          // Formato simple de 8 columnas (sin categoría)
          entry = {
            es: cleanCell(cells[0]),
            en: cleanCell(cells[1]), 
            de: cleanCell(cells[2]),
            pt: cleanCell(cells[3]),
            ru: cleanCell(cells[4]),
            ruRom: cleanCell(cells[5]),
            zh: cleanCell(cells[6]),
            zhPinyin: segmentPinyin(cleanCell(cells[7])),
            grammaticalCategory: 'sustantivo', // por defecto
            source: fileName,
            day: day,
            filePath: path.relative(projectRoot, filePath)
          };
        }

        // Validar y agregar entrada SOLO si es vocabulario real
        if (entry && entry.es && entry.en && entry.de && entry.pt && entry.ru) {
          // Verificar que no sea contenido no-vocabulario
          const isValidVocabulary = !isNonVocabularyContent(entry.es) &&
                                   !isNonVocabularyContent(entry.en) &&
                                   entry.es.length > 1 && 
                                   entry.en.length > 1 &&
                                   !/\d/.test(entry.es) && !/\d/.test(entry.en) &&
                                   entry.es.toLowerCase() !== entry.en.toLowerCase(); // Evitar traducciones idénticas
          
          // VALIDACIÓN ADICIONAL: Verificar que cada traducción pertenezca a su idioma correcto
          const languageValidation = isWordInLanguage(entry.es, 'es') &&
                                    isWordInLanguage(entry.en, 'en') &&
                                    isWordInLanguage(entry.de, 'de') &&
                                    isWordInLanguage(entry.pt, 'pt') &&
                                    isWordInLanguage(entry.ru, 'ru') &&
                                    (entry.ruRom ? isWordInLanguage(entry.ruRom, 'ruRom') : true) &&
                                    (entry.zh ? isWordInLanguage(entry.zh, 'zh') : true) &&
                                    (entry.zhPinyin ? isWordInLanguage(entry.zhPinyin, 'zhPinyin') : true);
          
          if (isValidVocabulary && languageValidation) {
            vocabulary.push(entry);
          } else {
            if (!languageValidation) {
              console.log(`   ⚠️ Entrada excluida (idiomas mezclados): es:"${entry.es}" en:"${entry.en}" de:"${entry.de}" pt:"${entry.pt}" ru:"${entry.ru}"`);
            } else {
              console.log(`   ⚠️ Contenido excluido (no es vocabulario): "${entry.es}" -> "${entry.en}"`);
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

async function buildDictionary() {
  console.log('🚀 Iniciando construcción del diccionario...');
  
  // Crear directorio de datos si no existe
  const dataDir = path.join(projectRoot, 'public', 'data');
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

  // Procesar entradas y agrupar por palabra - SOLO en su idioma correspondiente
  for (const entry of allVocabulary) {
    const languages = ['es', 'en', 'de', 'pt', 'ru', 'ruRom', 'zh', 'zhPinyin'];
    
    // CREAR ENTRADA BASE PARA DEDUPLICACIÓN
    const entryKey = JSON.stringify({
      es: entry.es,
      en: entry.en, 
      de: entry.de,
      pt: entry.pt,
      ru: entry.ru,
      ruRom: entry.ruRom,
      zh: entry.zh,
      zhPinyin: entry.zhPinyin
    });
    
    for (const lang of languages) {
      const word = entry[lang];
      if (word && word.length > 0 && word !== '-' && word !== '—' && word !== '...') {
        
        // FILTRO CRÍTICO: Verificar que la palabra sea del idioma correcto
        const isCorrectLanguage = isWordInLanguage(word, lang);
        if (!isCorrectLanguage) {
          console.log(`   ⚠️ Palabra "${word}" no pertenece al idioma ${lang}, omitiendo`);
          continue; 
        }
        
        if (!dictionary[lang].has(word)) {
          dictionary[lang].set(word, []);
        }
        
        // Verificar duplicados por significado base (español) en lugar de todas las traducciones
        const existingEntries = dictionary[lang].get(word);
        let baseMeaning = entry.es; // Usar español como significado base
        
        // VALIDACIÓN CRÍTICA: Verificar que el significado base sea realmente español
        if (!isWordInLanguage(baseMeaning, 'es')) {
          console.log(`   ⚠️ PROBLEMA: Significado base "${baseMeaning}" no es español válido, omitiendo entrada`);
          continue;
        }
        
        const existingEntry = existingEntries.find(existing => 
          existing.translations.es === baseMeaning
        );
        
        if (existingEntry) {
          // Si ya existe una entrada con el mismo significado, solo añadir la lección
          if (!existingEntry.lessons) {
            existingEntry.lessons = [existingEntry.day];
          }
          if (!existingEntry.lessons.includes(entry.day)) {
            existingEntry.lessons.push(entry.day);
            console.log(`   🔄 Consolidando "${word}" (${baseMeaning}) - añadiendo día ${entry.day}`);
          }
        } else {
          // Nueva entrada con significado diferente
          dictionary[lang].get(word).push({
            translations: entry, // Mantener todas las traducciones disponibles
            source: entry.source,
            day: entry.day,
            lessons: [entry.day], // Inicializar array de lecciones
            filePath: entry.filePath
          });
        }
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