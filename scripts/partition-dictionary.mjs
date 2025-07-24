#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function partitionDictionary() {
  console.log('🔄 Particionando diccionario para optimizar rendimiento...');
  
  try {
    const dictionaryPath = path.join(projectRoot, 'public', 'data', 'dictionary.json');
    const statsPath = path.join(projectRoot, 'public', 'data', 'dictionary-stats.json');
    
    // Leer diccionario completo
    const dictionaryContent = await fs.readFile(dictionaryPath, 'utf-8');
    const dictionary = JSON.parse(dictionaryContent);
    
    const statsContent = await fs.readFile(statsPath, 'utf-8');
    const stats = JSON.parse(statsContent);
    
    // Crear directorio para diccionarios por idioma
    const langDir = path.join(projectRoot, 'public', 'data', 'internal', 'v1', 'dictionary', 'languages');
    await fs.mkdir(langDir, { recursive: true });
    
    // Información de idiomas
    const languages = {
      es: { name: 'español', code: 'es', file: 'es.json' },
      en: { name: 'english', code: 'en', file: 'en.json' },
      de: { name: 'deutsch', code: 'de', file: 'de.json' },
      pt: { name: 'português', code: 'pt', file: 'pt.json' },
      ru: { name: 'русский', code: 'ru', file: 'ru.json' },
      ruRom: { name: 'русский романизированный', code: 'ru-rom', file: 'ru-rom.json' },
      zh: { name: '中文', code: 'zh', file: 'zh.json' },
      zhPinyin: { name: '中文 pinyin', code: 'zh-pinyin', file: 'zh-pinyin.json' }
    };
    
    // Partir diccionario por idiomas
    const partitionSizes = {};
    
    for (const [langKey, langInfo] of Object.entries(languages)) {
      const langData = dictionary[langKey] || {};
      const wordCount = Object.keys(langData).length;
      
      // Crear estructura optimizada para cada idioma
      const optimizedLangData = {
        meta: {
          language: langInfo.name,
          code: langInfo.code,
          wordCount: wordCount,
          lastUpdated: stats.lastUpdated,
          generatedBy: 'partition-dictionary.mjs v1.0'
        },
        index: {
          // Crear índice alfabético para navegación rápida
          letters: {},
          popular: [], // Palabras más frecuentes (aparecen en más lecciones)
          recent: []   // Palabras de lecciones recientes
        },
        words: {}
      };
      
      // Procesar palabras y extraer solo el idioma específico
      const processedWords = {};
      
      Object.entries(langData).forEach(([word, entries]) => {
        // El filtrado ya se hizo en build-dictionary.mjs, aquí solo procesamos
        const translatedWord = entries[0]?.translations[langKey] || word;
        
        // Transformar cada entrada para extraer solo la información del idioma específico
        const transformedEntries = entries.map(entry => {
          const currentLangTranslation = entry.translations[langKey];
          
          return {
            word: currentLangTranslation || word, // Usar traducción del idioma actual o palabra original
            meaning: entry.translations.es || word, // Significado base siempre en español
            source: entry.source,
            day: entry.day,
            lessons: entry.lessons || [entry.day], // Usar lecciones consolidadas si existen
            filePath: entry.filePath,
            // Mantener contexto de otras traducciones para referencia
            originalWord: word,
            allTranslations: entry.translations
          };
        });

        // Las entradas ya vienen consolidadas desde build-dictionary.mjs
        const uniqueEntries = transformedEntries;
        
        processedWords[translatedWord] = {
          entries: uniqueEntries,
          frequency: uniqueEntries.length,
          lessons: entries.map(e => e.day).sort((a, b) => a - b),
          firstAppearance: Math.min(...entries.map(e => e.day || 0)),
          originalWord: word, // Palabra original (clave en diccionario base)
          meaning: entries[0]?.translations?.es || word // Significado base siempre en español
        };
      });
      
      // Ordenar palabras
      const sortedWords = Object.entries(processedWords).sort(([a], [b]) => {
        if (langKey === 'zh' || langKey === 'ru') {
          return a.localeCompare(b, langKey);
        }
        return a.localeCompare(b);
      });
      
      // Índice por letras
      sortedWords.forEach(([word, data]) => {
        const firstChar = word.charAt(0).toUpperCase();
        if (!optimizedLangData.index.letters[firstChar]) {
          optimizedLangData.index.letters[firstChar] = [];
        }
        optimizedLangData.index.letters[firstChar].push(word);
        
        // Agregar palabra con información completa
        optimizedLangData.words[word] = data;
      });
      
      // Palabras populares (aparecen en múltiples lecciones)
      optimizedLangData.index.popular = sortedWords
        .filter(([_, data]) => data.frequency > 1)
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, 50)
        .map(([word]) => word);
        
      // Palabras recientes (de lecciones más altas)
      optimizedLangData.index.recent = sortedWords
        .map(([word, data]) => ({
          word,
          maxDay: Math.max(...data.lessons)
        }))
        .sort((a, b) => b.maxDay - a.maxDay)
        .slice(0, 100)
        .map(item => item.word);
      
      // Guardar archivo por idioma
      const langFilePath = path.join(langDir, langInfo.file);
      await fs.writeFile(
        langFilePath,
        JSON.stringify(optimizedLangData, null, 2),
        'utf-8'
      );
      
      partitionSizes[langKey] = {
        words: wordCount,
        fileSize: JSON.stringify(optimizedLangData).length,
        filePath: langInfo.file
      };
      
      console.log(`   ✅ ${langInfo.name}: ${wordCount} palabras → ${langInfo.file}`);
    }
    
    // Crear índice general del diccionario
    const generalIndex = {
      meta: {
        totalWords: stats.totalUniqueWords,
        totalEntries: stats.totalEntries,
        totalLanguages: Object.keys(languages).length,
        totalLessons: Object.keys(stats.byLesson).length,
        lastUpdated: stats.lastUpdated,
        generatedBy: 'partition-dictionary.mjs v1.0'
      },
      languages: languages,
      partitions: partitionSizes,
      stats: stats,
      // Mapa de rutas para carga dinámica
      routes: Object.fromEntries(
        Object.entries(languages).map(([key, info]) => [
          info.code, 
          `./lang/${info.file}`
        ])
      )
    };
    
    await fs.writeFile(
      path.join(projectRoot, 'public', 'data', 'dictionary-index.json'),
      JSON.stringify(generalIndex, null, 2),
      'utf-8'
    );
    
    // Crear versión ligera del diccionario original (solo metadatos)
    const lightDictionary = {
      meta: generalIndex.meta,
      languages: Object.fromEntries(
        Object.entries(dictionary).map(([lang, words]) => [
          lang,
          {
            count: Object.keys(words).length,
            sample: Object.keys(words).slice(0, 10) // Muestra de 10 palabras
          }
        ])
      ),
      loadFrom: './dictionary-index.json'
    };
    
    await fs.writeFile(
      path.join(projectRoot, 'public', 'data', 'dictionary-light.json'),
      JSON.stringify(lightDictionary, null, 2),
      'utf-8'
    );
    
    // Estadísticas finales
    const originalSize = JSON.stringify(dictionary).length;
    const totalPartitionedSize = Object.values(partitionSizes).reduce((sum, p) => sum + p.fileSize, 0);
    const indexSize = JSON.stringify(generalIndex).length;
    const lightSize = JSON.stringify(lightDictionary).length;
    
    console.log('\n📊 ESTADÍSTICAS DE PARTICIÓN:');
    console.log(`   📁 Archivo original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🔀 Total particionado: ${(totalPartitionedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📋 Índice general: ${(indexSize / 1024).toFixed(2)} KB`);
    console.log(`   ⚡ Diccionario ligero: ${(lightSize / 1024).toFixed(2)} KB`);
    console.log(`   💾 Ahorro en carga inicial: ${((originalSize - lightSize) / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Partición completada exitosamente');
    console.log('   Los diccionarios ahora se cargan dinámicamente por idioma');
    
  } catch (error) {
    console.error('❌ Error particionando diccionario:', error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  partitionDictionary().catch(console.error);
}

export { partitionDictionary };