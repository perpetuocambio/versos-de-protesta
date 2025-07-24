#!/usr/bin/env node

/**
 * GENERACIÓN DE DATOS GRAMATICALES MULTILINGÜES
 * =============================================
 * 
 * Extrae patrones gramaticales de las lecciones existentes para crear
 * un visualizador gramatical interactivo con análisis sintáctico.
 * 
 * Características:
 * - Extracción automática de gramática del frontmatter
 * - Análisis sintáctico de frases de canciones
 * - Comparación entre 5 idiomas
 * - Datos para árboles sintácticos SVG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const BLOG_CONTENT_PATH = path.join(PROJECT_ROOT, 'src', 'content', 'blog');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'grammar');
const GRAMMAR_INDEX = path.join(OUTPUT_DIR, 'index.json');
const SYNTAX_PATTERNS = path.join(OUTPUT_DIR, 'syntax-patterns.json');
const CASE_SYSTEMS = path.join(OUTPUT_DIR, 'case-systems.json');
const COMPARATIVE_STRUCTURES = path.join(OUTPUT_DIR, 'comparative-structures.json');

// Crear directorios si no existen
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Creado directorio: ${dirPath}`);
  }
}

// Extraer frontmatter de archivos markdown
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return null;
  
  const frontmatterText = match[1];
  const frontmatter = {};
  
  // Parser YAML simple
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('grammarTopics:')) {
      currentKey = 'grammarTopics';
      frontmatter[currentKey] = [];
      currentArray = frontmatter[currentKey];
      continue;
    }
    
    if (currentArray && trimmedLine.startsWith('- ')) {
      const item = trimmedLine.replace('- ', '').replace(/['"]/g, '').trim();
      currentArray.push(item);
      continue;
    }
    
    if (trimmedLine.includes(':') && !trimmedLine.startsWith('-')) {
      currentArray = null; // Salir del modo array
      
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').replace(/['"]/g, '').trim();
      
      if (key.trim() === 'title') frontmatter.title = value;
      if (key.trim() === 'day') frontmatter.day = parseInt(value);
      if (key.trim() === 'difficultyLevel') frontmatter.difficultyLevel = value;
    }
  }
  
  return frontmatter;
}

// Base de datos de patrones gramaticales por idioma
const GRAMMAR_PATTERNS = {
  // Patrones sintácticos básicos
  declarative: {
    es: { pattern: 'SVO', example: 'El pueblo canta', structure: ['Det', 'N', 'V'] },
    en: { pattern: 'SVO', example: 'The people sing', structure: ['Det', 'N', 'V'] },
    de: { pattern: 'SVO/SOV', example: 'Das Volk singt', structure: ['Det', 'N', 'V'] },
    pt: { pattern: 'SVO', example: 'O povo canta', structure: ['Det', 'N', 'V'] },
    ru: { pattern: 'SVO(flexible)', example: 'Народ поёт', structure: ['N', 'V'] }
  },
  
  interrogative: {
    es: { pattern: 'QVO/VSO', example: '¿Qué canta el pueblo?', structure: ['Q', 'V', 'Det', 'N'] },
    en: { pattern: 'QVS', example: 'What does the people sing?', structure: ['Q', 'Aux', 'Det', 'N', 'V'] },
    de: { pattern: 'QVS', example: 'Was singt das Volk?', structure: ['Q', 'V', 'Det', 'N'] },
    pt: { pattern: 'QVO', example: 'O que canta o povo?', structure: ['Q', 'V', 'Det', 'N'] },
    ru: { pattern: 'QVO', example: 'Что поёт народ?', structure: ['Q', 'V', 'N'] }
  },
  
  imperative: {
    es: { pattern: 'V(+Obj)', example: '¡Canta la Internacional!', structure: ['V', 'Det', 'N'] },
    en: { pattern: 'V(+Obj)', example: 'Sing the International!', structure: ['V', 'Det', 'N'] },
    de: { pattern: 'V(+Obj)', example: 'Sing die Internationale!', structure: ['V', 'Det', 'N'] },
    pt: { pattern: 'V(+Obj)', example: 'Canta a Internacional!', structure: ['V', 'Det', 'N'] },
    ru: { pattern: 'V(+Obj)', example: 'Пой Интернационал!', structure: ['V', 'N'] }
  }
};

// Sistemas de casos (alemán y ruso)
const CASE_SYSTEMS_DATA = {
  german: {
    nominative: { es: 'nominativo', function: 'sujeto', example: 'der Arbeiter singt' },
    accusative: { es: 'acusativo', function: 'objeto directo', example: 'ich sehe den Arbeiter' },
    dative: { es: 'dativo', function: 'objeto indirecto', example: 'ich gebe dem Arbeiter' },
    genitive: { es: 'genitivo', function: 'posesión', example: 'das Lied des Arbeiters' }
  },
  
  russian: {
    nominative: { es: 'именительный', function: 'sujeto', example: 'рабочий поёт' },
    accusative: { es: 'винительный', function: 'objeto directo', example: 'я вижу рабочего' },
    genitive: { es: 'родительный', function: 'posesión/negación', example: 'песня рабочего' },
    dative: { es: 'дательный', function: 'objeto indirecto', example: 'я даю рабочему' },
    instrumental: { es: 'творительный', function: 'instrumento/agente', example: 'пою голосом' },
    prepositional: { es: 'предложный', function: 'ubicación', example: 'думаю о рабочем' }
  }
};

// Temas gramaticales conocidos por día
const KNOWN_GRAMMAR_TOPICS = {
  0: ['Artículos básicos', 'Presente simple', 'Pronunciación básica'],
  1: ['Subjuntivo básico', 'Imperativo', 'Expresiones temporales'],
  2: ['Voz pasiva', 'Participios pasados', 'Preposiciones básicas'],
  3: ['Pretérito perfecto', 'Adjetivos posesivos', 'Construcciones enfáticas'],
  4: ['Presente continuo', 'Preposiciones complejas', 'Verbos modales'],
  5: ['Casos rusos básicos', 'Aspecto perfectivo/imperfectivo', 'Declinaciones'],
  6: ['Artículos alemanes', 'Orden de palabras alemán', 'Verbos separables'],
  7: ['Clasificadores chinos', 'Tonos', 'Orden SVO'],
  8: ['Casos rusos avanzados', 'Aspecto verbal', 'Participios activos'],
  9: ['Imperativo de cortesía', 'Construcciones exclamativas', 'Interjecciones'],
  10: ['Construcciones idiomáticas', 'Verbos de movimiento', 'Aspectos culturales'],
  11: ['Subjuntivo comparativo', 'Construcciones causales', 'Phrasal verbs']
};

// Frases ejemplares de las canciones para análisis sintáctico
const EXAMPLE_SENTENCES = {
  'L\'Internationale': {
    es: 'El pueblo unido jamás será vencido',
    en: 'The united people will never be defeated',
    de: 'Das vereinte Volk wird niemals besiegt werden',
    pt: 'O povo unido jamais será vencido',
    ru: 'Объединённый народ никогда не будет побеждён'
  },
  
  'A las Barricadas': {
    es: 'A las barricadas, a las barricadas',
    en: 'To the barricades, to the barricades',
    de: 'Zu den Barrikaden, zu den Barrikaden',
    pt: 'Às barricadas, às barricadas',
    ru: 'На баррикады, на баррикады'
  },
  
  'Der heimliche Aufmarsch': {
    es: 'Los trabajadores del mundo se levantan',
    en: 'The workers of the world are rising',
    de: 'Die Arbeiter der Welt erheben sich',
    pt: 'Os trabalhadores do mundo se levantam',
    ru: 'Рабочие мира поднимаются'
  }
};

// Procesar archivos del blog
async function processLessonFiles() {
  console.log('📖 Procesando archivos de lecciones para gramática...');
  
  const lessons = [];
  const blogFiles = fs.readdirSync(BLOG_CONTENT_PATH)
    .filter(file => file.endsWith('.md') && file.startsWith('dia-'))
    .sort();
  
  for (const file of blogFiles) {
    const filePath = path.join(BLOG_CONTENT_PATH, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    
    if (frontmatter) {
      const day = frontmatter.day;
      const grammarTopics = frontmatter.grammarTopics || KNOWN_GRAMMAR_TOPICS[day] || [];
      
      const lesson = {
        day: day,
        title: frontmatter.title,
        grammarTopics: grammarTopics,
        difficultyLevel: frontmatter.difficultyLevel || 'intermediate',
        file: file
      };
      
      lessons.push(lesson);
      console.log(`  ✅ Día ${lesson.day}: ${lesson.grammarTopics.length} temas gramaticales`);
    }
  }
  
  console.log(`📊 Total lecciones procesadas: ${lessons.length}`);
  return lessons;
}

// Generar datos de patrones sintácticos
function generateSyntaxPatterns() {
  console.log('\n🌳 Generando patrones sintácticos...');
  
  const syntaxData = {
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0.0",
      languages: ['es', 'en', 'de', 'pt', 'ru'],
      description: "Patrones sintácticos para visualizador de árboles"
    },
    patterns: {},
    examples: {}
  };
  
  // Procesar patrones gramaticales
  for (const [patternType, languages] of Object.entries(GRAMMAR_PATTERNS)) {
    syntaxData.patterns[patternType] = {};
    
    for (const [lang, data] of Object.entries(languages)) {
      syntaxData.patterns[patternType][lang] = {
        ...data,
        syntaxTree: generateSyntaxTree(data.structure, data.example, lang)
      };
    }
  }
  
  // Procesar frases ejemplares
  for (const [song, translations] of Object.entries(EXAMPLE_SENTENCES)) {
    syntaxData.examples[song] = {};
    
    for (const [lang, sentence] of Object.entries(translations)) {
      syntaxData.examples[song][lang] = {
        sentence: sentence,
        analysis: analyzeSentence(sentence, lang),
        syntaxTree: generateSyntaxTreeFromSentence(sentence, lang)
      };
    }
  }
  
  return syntaxData;
}

// Generar árbol sintáctico simple
function generateSyntaxTree(structure, example, language) {
  const words = example.split(' ');
  const tree = {
    type: 'S', // Sentence
    children: []
  };
  
  // Mapeo simple estructura -> palabras
  for (let i = 0; i < structure.length && i < words.length; i++) {
    const pos = structure[i];
    const word = words[i];
    
    tree.children.push({
      type: pos,
      value: word,
      position: i,
      language: language
    });
  }
  
  return tree;
}

// Análisis sintáctico básico de una oración
function analyzeSentence(sentence, language) {
  const words = sentence.split(/[\s.,!?]+/).filter(w => w.length > 0);
  
  const analysis = {
    wordCount: words.length,
    complexity: words.length > 6 ? 'complex' : words.length > 3 ? 'medium' : 'simple',
    features: []
  };
  
  // Detectar características específicas por idioma
  switch (language) {
    case 'de':
      if (sentence.includes('wird') || sentence.includes('werden')) {
        analysis.features.push('future_tense');
      }
      if (sentence.includes('der') || sentence.includes('die') || sentence.includes('das')) {
        analysis.features.push('definite_articles');
      }
      break;
      
    case 'ru':
      if (/[а-яё]/.test(sentence)) {
        analysis.features.push('cyrillic_script');
      }
      if (sentence.includes('не')) {
        analysis.features.push('negation');
      }
      break;
      
    case 'zh':
      if (/[\u4e00-\u9fff]/.test(sentence)) {
        analysis.features.push('chinese_characters');
      }
      break;
  }
  
  return analysis;
}

// Generar árbol sintáctico desde oración completa
function generateSyntaxTreeFromSentence(sentence, language) {
  const words = sentence.split(/[\s.,!?]+/).filter(w => w.length > 0);
  
  // Análisis sintáctico simplificado
  const tree = {
    type: 'S',
    language: language,
    children: words.map((word, index) => ({
      type: guessPartOfSpeech(word, language, index, words.length),
      value: word,
      position: index
    }))
  };
  
  return tree;
}

// Adivinar parte de la oración (heurística simple)
function guessPartOfSpeech(word, language, position, totalWords) {
  const lowercaseWord = word.toLowerCase();
  
  // Artículos definidos
  const articles = {
    es: ['el', 'la', 'los', 'las'],
    en: ['the'],
    de: ['der', 'die', 'das', 'den', 'dem', 'des'],
    pt: ['o', 'a', 'os', 'as'],
    ru: [] // No hay artículos
  };
  
  if (articles[language] && articles[language].includes(lowercaseWord)) {
    return 'Det';
  }
  
  // Preposiciones comunes
  const prepositions = {
    es: ['a', 'de', 'en', 'con', 'por', 'para'],
    en: ['to', 'of', 'in', 'with', 'for', 'by'],
    de: ['zu', 'von', 'in', 'mit', 'für', 'durch'],
    pt: ['a', 'de', 'em', 'com', 'por', 'para'],
    ru: ['в', 'на', 'с', 'к', 'от', 'для']
  };
  
  if (prepositions[language] && prepositions[language].includes(lowercaseWord)) {
    return 'Prep';
  }
  
  // Si es la primera palabra (puede ser sujeto)
  if (position === 0) {
    return 'N';
  }
  
  // Si es la última palabra y termina en vocal (puede ser verbo en español)
  if (position === totalWords - 1 && language === 'es' && /[aeiou]$/.test(lowercaseWord)) {
    return 'V';
  }
  
  // Por defecto, asumir sustantivo
  return 'N';
}

// Generar datos de sistemas de casos
function generateCaseSystemsData() {
  console.log('\n📐 Generando datos de sistemas de casos...');
  
  const caseData = {
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0.0",
      languages: ['de', 'ru'],
      description: "Sistemas de casos para alemán y ruso"
    },
    systems: CASE_SYSTEMS_DATA,
    examples: {
      german_declensions: {
        'der Arbeiter': {
          nominative: 'der Arbeiter',
          accusative: 'den Arbeiter', 
          dative: 'dem Arbeiter',
          genitive: 'des Arbeiters'
        }
      },
      russian_declensions: {
        'рабочий': {
          nominative: 'рабочий',
          accusative: 'рабочего',
          genitive: 'рабочего', 
          dative: 'рабочему',
          instrumental: 'рабочим',
          prepositional: 'рабочем'
        }
      }
    }
  };
  
  return caseData;
}

// Función principal
async function generateGrammarData() {
  console.log('🚀 Iniciando generación de datos gramaticales...\n');
  
  // Preparar directorios
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Procesar lecciones
  const lessons = await processLessonFiles();
  
  // Generar datos sintácticos
  const syntaxData = generateSyntaxPatterns();
  
  // Generar datos de casos
  const caseData = generateCaseSystemsData();
  
  // Generar índice principal
  const grammarIndex = {
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0.0",
      totalLessons: lessons.length,
      languages: ['es', 'en', 'de', 'pt', 'ru'],
      features: ['syntax_trees', 'case_systems', 'comparative_analysis']
    },
    lessons: lessons.reduce((acc, lesson) => {
      acc[lesson.day] = {
        title: lesson.title,
        grammarTopics: lesson.grammarTopics,
        difficultyLevel: lesson.difficultyLevel
      };
      return acc;
    }, {}),
    grammarTopics: {
      all: [...new Set(lessons.flatMap(l => l.grammarTopics))],
      byDifficulty: {
        beginner: lessons.filter(l => l.difficultyLevel === 'beginner').flatMap(l => l.grammarTopics),
        intermediate: lessons.filter(l => l.difficultyLevel === 'intermediate').flatMap(l => l.grammarTopics),
        advanced: lessons.filter(l => l.difficultyLevel === 'advanced').flatMap(l => l.grammarTopics)
      }
    }
  };
  
  // Guardar archivos
  fs.writeFileSync(GRAMMAR_INDEX, JSON.stringify(grammarIndex, null, 2), 'utf8');
  console.log(`💾 Guardado: ${GRAMMAR_INDEX}`);
  
  fs.writeFileSync(SYNTAX_PATTERNS, JSON.stringify(syntaxData, null, 2), 'utf8');
  console.log(`💾 Guardado: ${SYNTAX_PATTERNS}`);
  
  fs.writeFileSync(CASE_SYSTEMS, JSON.stringify(caseData, null, 2), 'utf8');
  console.log(`💾 Guardado: ${CASE_SYSTEMS}`);
  
  console.log(`\n✅ GENERACIÓN COMPLETADA`);
  console.log(`========================`);
  console.log(`📁 Directorio: ${OUTPUT_DIR}`);
  console.log(`📊 Lecciones procesadas: ${lessons.length}`);
  console.log(`🌳 Patrones sintácticos: ${Object.keys(syntaxData.patterns).length}`);
  console.log(`📐 Sistemas de casos: ${Object.keys(caseData.systems).length}`);
  console.log(`🔤 Frases de ejemplo: ${Object.keys(syntaxData.examples).length}`);
  
  return grammarIndex;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateGrammarData()
    .then(() => {
      console.log('🎉 ¡Datos gramaticales generados con éxito!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { generateGrammarData, GRAMMAR_PATTERNS, CASE_SYSTEMS_DATA };