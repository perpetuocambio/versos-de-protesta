#!/usr/bin/env node

/**
 * GENERADOR DE DICCIONARIOS POR IDIOMA
 * ====================================
 * 
 * Convierte el vocabulario consolidado (lesson-words.json) en archivos de diccionario
 * individuales por idioma (zh.json, en.json, etc.) que otros scripts pueden usar.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const LESSON_WORDS_PATH = path.join(projectRoot, 'public', 'data', 'lesson-words.json');
const OUTPUT_DIR = path.join(projectRoot, 'public', 'data', 'internal', 'v1', 'dictionary');

async function generateLanguageDictionaries() {
  console.log('🚀 Generando diccionarios por idioma...');
  
  try {
    // Leer vocabulario consolidado
    const lessonWordsData = JSON.parse(await fs.readFile(LESSON_WORDS_PATH, 'utf-8'));
    const words = lessonWordsData.words;
    
    console.log(`📚 Procesando ${words.length} palabras...`);
    
    // Mapeo de códigos de idioma a nombres
    const languageMapping = {
      'es': { name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
      'en': { name: 'English', nativeName: 'English', flag: '🇬🇧' },
      'de': { name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
      'pt': { name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
      'ru': { name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
      'ruRom': { name: 'Русский Rom.', nativeName: 'Russky Romanized', flag: '🇷🇺' },
      'zh': { name: '中文', nativeName: '中文', flag: '🇨🇳' },
      'zhPinyin': { name: '中文 Pinyin', nativeName: 'Zhōngwén Pinyin', flag: '🇨🇳' }
    };
    
    // Generar diccionarios por idioma
    const languageDictionaries = {};
    const timestamp = new Date().toISOString();
    
    for (const [langCode, langInfo] of Object.entries(languageMapping)) {
      const dictionary = {
        meta: {
          language: langCode,
          name: langInfo.name,
          nativeName: langInfo.nativeName,
          flag: langInfo.flag,
          wordCount: words.length,
          lastUpdated: timestamp,
          version: '1.0.0',
          generatedBy: 'generate-language-dictionaries.mjs',
          sourceFile: 'lesson-words.json'
        },
        words: {}
      };
      
      // Agregar palabras al diccionario del idioma
      for (const word of words) {
        const termInLanguage = word[langCode];
        if (termInLanguage) {
          dictionary.words[termInLanguage] = {
            id: word.id,
            term: termInLanguage,
            category: word.category,
            translations: {
              es: word.es,
              en: word.en,
              de: word.de,
              pt: word.pt,
              ru: word.ru,
              ruRom: word.ruRom,
              zh: word.zh,
              zhPinyin: word.zhPinyin
            },
            lessons: word.lessons,
            frequency: word.frequency,
            firstAppearance: word.firstAppearance,
            source: word.source
          };
          
          // Agregar información adicional china si está disponible
          if (word.zhStrokes) dictionary.words[termInLanguage].zhStrokes = word.zhStrokes;
          if (word.zhRadical) dictionary.words[termInLanguage].zhRadical = word.zhRadical;
          if (word.zhStructure) dictionary.words[termInLanguage].zhStructure = word.zhStructure;
        }
      }
      
      languageDictionaries[langCode] = dictionary;
    }
    
    // Crear directorio de salida si no existe
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Escribir archivos de diccionario por idioma
    const fileResults = [];
    for (const [langCode, dictionary] of Object.entries(languageDictionaries)) {
      // Mapear códigos de archivo según index.json existente
      const fileCode = langCode === 'ruRom' ? 'ru-rom' : 
                      langCode === 'zhPinyin' ? 'zh-pinyin' : langCode;
      
      const filename = `${fileCode}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      await fs.writeFile(filepath, JSON.stringify(dictionary, null, 2), 'utf-8');
      
      fileResults.push({
        file: filename,
        wordCount: Object.keys(dictionary.words).length,
        language: dictionary.meta.name
      });
      
      console.log(`✅ ${filename}: ${Object.keys(dictionary.words).length} palabras`);
    }
    
    // Actualizar index.json con información actualizada
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    const indexData = {
      version: '1.0',
      internal: {
        path: '/internal/v1/dictionary',
        isPublic: false,
        accessType: 'import-only'
      },
      meta: {
        totalLanguages: Object.keys(languageMapping).length,
        totalWords: words.length,
        totalEntries: words.length * Object.keys(languageMapping).length,
        lastUpdated: timestamp,
        description: 'Diccionario interno multilingüe de himnos obreros'
      },
      languages: Object.entries(languageMapping).map(([code, info]) => {
        const fileCode = code === 'ruRom' ? 'ru-rom' : 
                        code === 'zhPinyin' ? 'zh-pinyin' : code;
        return {
          code: code,
          name: info.name,
          nativeName: info.nativeName,
          wordCount: words.length,
          file: `${fileCode}.json`,
          flag: info.flag
        };
      })
    };
    
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log(`✅ index.json actualizado`);
    
    console.log('\n🎉 DICCIONARIOS GENERADOS EXITOSAMENTE');
    console.log('======================================');
    console.log(`📊 Estadísticas:`);
    console.log(`   • Idiomas: ${Object.keys(languageMapping).length}`);
    console.log(`   • Palabras por idioma: ${words.length}`);
    console.log(`   • Archivos generados: ${fileResults.length + 1} (+ index.json)`);
    console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
    
    return {
      success: true,
      files: fileResults.length,
      words: words.length,
      languages: Object.keys(languageMapping).length
    };
    
  } catch (error) {
    console.error('❌ Error generando diccionarios:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateLanguageDictionaries().catch(console.error);
}

export { generateLanguageDictionaries };