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
    
    // SOLO procesar tablas de vocabulario legítimas
    const tableRegexes = [
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
        
        const isExcluded = hasProblematicHeader || hasProblematicContent || hasConjugationContent;
        
        if (isExcluded) {
          console.log(`   🚫 Tabla excluida - header/contexto problemático: ${fullMatch.split('\n')[0]}`);
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
        
        if (cells.length >= 9 && cells[0].toLowerCase() !== 'concepto') {
          // Detectar tabla con formato "Año | Evento | Idiomas..." (10 columnas)
          const hasEventColumn = cells.length >= 10;
          
          if (hasEventColumn) {
            // Formato: | Año | Evento | Español | English | Deutsch | Português | Русский | Русский Rom. | 中文 | Pinyin |
            entry = {
              es: cleanCell(cells[2]), // Saltar año y evento
              en: cleanCell(cells[3]), 
              de: cleanCell(cells[4]),
              pt: cleanCell(cells[5]),
              ru: cleanCell(cells[6]),
              ruRom: cleanCell(cells[7]),
              zh: cleanCell(cells[8]),
              zhPinyin: cleanCell(cells[9]),
              source: fileName,
              day: day,
              filePath: filePath,
              originalKey: cleanCell(cells[0]), // Mantener la clave original (año)
              context: cleanCell(cells[1]) // Mantener el contexto (evento)
            };
          } else {
            // Formato simple: | Español | English | Deutsch | Português | Русский | Русский Rom. | 中文 | Pinyin |
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
        } else if (cells.length >= 9) {
          // Detectar si primera columna es descriptiva (concepto/categoría)
          const firstCell = cleanCell(cells[0]).toLowerCase();
          const isDescriptiveFirstColumn = 
            firstCell.includes('concepto') || 
            firstCell.includes('tradición') || 
            firstCell.includes('periodo') || 
            firstCell.includes('función') || 
            firstCell.includes('región') ||
            firstCell.includes('social') ||
            firstCell.includes('clave') ||
            cells[0].includes('**') || // Si está en bold, probablemente es descriptivo
            /^\*\*.*\*\*$/.test(cells[0].trim()); // Detectar formato **texto**
          
          if (isDescriptiveFirstColumn) {
            // Formato: | Concepto | Español | English | Deutsch | Português | Русский | Русский Rom. | 中文 | Pinyin |
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
          } else {
            // No es descriptivo, usar formato directo con 9 columnas
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

        // Validar y agregar entrada SOLO si es vocabulario real
        if (entry && entry.es && entry.en && entry.de && entry.pt && entry.ru) {
          // Verificar que no sea contenido no-vocabulario
          const isValidVocabulary = !isNonVocabularyContent(entry.es) &&
                                   !isNonVocabularyContent(entry.en) &&
                                   entry.es.length > 1 && 
                                   entry.en.length > 1 &&
                                   !/\d/.test(entry.es) && !/\d/.test(entry.en) &&
                                   entry.es.toLowerCase() !== entry.en.toLowerCase(); // Evitar traducciones idénticas
          
          if (isValidVocabulary) {
            vocabulary.push(entry);
          } else {
            console.log(`   ⚠️ Contenido excluido (no es vocabulario): "${entry.es}" -> "${entry.en}"`);
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
    
    for (const lang of languages) {
      const word = entry[lang];
      if (word && word.length > 0 && word !== '-' && word !== '—' && word !== '...') {
        // Solo agregar la palabra al diccionario de su idioma correspondiente
        if (!dictionary[lang].has(word)) {
          dictionary[lang].set(word, []);
        }
        dictionary[lang].get(word).push({
          translations: entry, // Mantener todas las traducciones disponibles
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