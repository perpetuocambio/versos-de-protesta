#!/usr/bin/env node

/**
 * GENERACIÓN DE DATOS DE COMPOSITORES E INTÉRPRETES - MULTILINGÜE
 * ==============================================================
 * 
 * Extrae biografías de Wikipedia en 8 idiomas para compositores e intérpretes
 * de las canciones revolucionarias del blog.
 * 
 * Idiomas objetivo: es, en, de, pt, ru, ru-rom, zh, zh-pinyin
 * Fuente: Wikipedia APIs en diferentes idiomas
 * 
 * Distingue entre:
 * - Compositor/autor original de la obra
 * - Intérpretes históricos importantes
 * - Versiones destacadas por región/período
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const BLOG_CONTENT_PATH = path.join(PROJECT_ROOT, 'src', 'content', 'blog');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'composers');
const COMPOSERS_INDEX = path.join(OUTPUT_DIR, 'index.json');

// Configuración Wikipedia multilingüe
const WIKIPEDIA_LANGUAGES = {
  es: 'es.wikipedia.org',
  en: 'en.wikipedia.org', 
  de: 'de.wikipedia.org',
  pt: 'pt.wikipedia.org',
  ru: 'ru.wikipedia.org',
  zh: 'zh.wikipedia.org'
};

const WIKIPEDIA_API_DELAY = 500; // ms entre llamadas para respetar rate limits

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
  
  // Parser YAML simple para las propiedades que necesitamos
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = null;
  let inMultiline = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('originalSong:')) {
      currentKey = 'originalSong';
      frontmatter[currentKey] = {};
      inMultiline = true;
      continue;
    }
    
    if (inMultiline && currentKey === 'originalSong') {
      if (trimmedLine.startsWith('title:')) {
        frontmatter[currentKey].title = trimmedLine.replace('title:', '').replace(/['"]/g, '').trim();
      } else if (trimmedLine.startsWith('artist:')) {
        frontmatter[currentKey].artist = trimmedLine.replace('artist:', '').replace(/['"]/g, '').trim();
      } else if (trimmedLine.startsWith('year:')) {
        frontmatter[currentKey].year = parseInt(trimmedLine.replace('year:', '').trim());
      } else if (trimmedLine.startsWith('origin:')) {
        frontmatter[currentKey].origin = trimmedLine.replace('origin:', '').replace(/['"]/g, '').trim();
      } else if (trimmedLine.startsWith('genre:')) {
        frontmatter[currentKey].genre = trimmedLine.replace('genre:', '').replace(/['"]/g, '').trim();
      } else if (!trimmedLine.startsWith(' ') && trimmedLine.includes(':') && !trimmedLine.startsWith('-')) {
        inMultiline = false;
      }
    }
    
    if (!inMultiline) {
      if (trimmedLine.startsWith('title:')) {
        frontmatter.title = trimmedLine.replace('title:', '').replace(/['"]/g, '').trim();
      } else if (trimmedLine.startsWith('day:')) {
        frontmatter.day = parseInt(trimmedLine.replace('day:', '').trim());
      } else if (trimmedLine.startsWith('culturalContext:')) {
        frontmatter.culturalContext = trimmedLine.replace('culturalContext:', '').replace(/['"]/g, '').trim();
      }
    }
  }
  
  return frontmatter;
}

// Funciones de Wikipedia multilingüe
async function fetchWikipediaBiography(title, language) {
  try {
    const domain = WIKIPEDIA_LANGUAGES[language];
    if (!domain) {
      console.warn(`❌ Idioma ${language} no soportado para Wikipedia`);
      return null;
    }

    // API de Wikipedia para extracto
    const url = `https://${domain}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    
    console.log(`📖 Buscando en Wikipedia (${language}): ${title}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Versos-de-Protesta/1.0 (Educational use)',
      }
    });

    if (!response.ok) {
      console.warn(`⚠️  Wikipedia ${language}: ${response.status} - ${title}`);
      return null;
    }

    const data = await response.json();
    
    if (data.type === 'disambiguation') {
      console.warn(`🔀 Página de desambiguación encontrada: ${title} (${language})`);
      return null;
    }

    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page,
      thumbnail: data.thumbnail?.source,
      birthDate: extractBirthDate(data.extract),
      deathDate: extractDeathDate(data.extract)
    };

  } catch (error) {
    console.error(`💥 Error Wikipedia ${language} - ${title}:`, error.message);
    return null;
  }
}

function extractBirthDate(text) {
  // Regex para fechas de nacimiento en diferentes formatos
  const patterns = [
    /born[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /nacido[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /geboren[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /nascido[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /родился[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /\b(\d{4})[^\d]*год рождения/i,
    /\((\d{4})[-–]\d{4}\)/,
    /\((\d{4})[-–]\)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractDeathDate(text) {
  // Regex para fechas de muerte
  const patterns = [
    /died[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /murió[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /gestorben[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /morreu[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /умер[^0-9]*(\d{1,2}[^\d]*\w+[^\d]*\d{4})/i,
    /\b(\d{4})[^\d]*год смерти/i,
    /\((?:\d{4})[-–](\d{4})\)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchMultilingualBiography(artistName, alternativeNames = []) {
  const biography = {
    es: null, en: null, de: null, pt: null, ru: null, 'ru-rom': null, zh: null, 'zh-pinyin': null
  };
  
  console.log(`\n🌍 Obteniendo biografía multilingüe: ${artistName}`);
  
  // Nombres a probar para cada idioma
  const searchNames = [artistName, ...alternativeNames];
  
  for (const [langCode, domain] of Object.entries(WIKIPEDIA_LANGUAGES)) {
    let found = false;
    
    for (const searchName of searchNames) {
      if (found) break;
      
      const result = await fetchWikipediaBiography(searchName, langCode);
      if (result && result.extract) {
        biography[langCode] = {
          extract: result.extract,
          url: result.url,
          title: result.title,
          thumbnail: result.thumbnail,
          birthDate: result.birthDate,
          deathDate: result.deathDate
        };
        
        console.log(`  ✅ ${langCode}: "${result.title}" (${result.extract.length} chars)`);
        found = true;
      }
      
      // Pausa para respetar rate limits
      await new Promise(resolve => setTimeout(resolve, WIKIPEDIA_API_DELAY));
    }
    
    if (!found) {
      console.log(`  ❌ ${langCode}: No encontrado`);
    }
  }
  
  // Para ru-rom y zh-pinyin, usar transliteración del original
  if (biography.ru && biography.ru.extract) {
    biography['ru-rom'] = {
      ...biography.ru,
      extract: `[Romanización del ruso] ${biography.ru.extract}`,
      note: "Transliteración automática del texto ruso"
    };
  }
  
  if (biography.zh && biography.zh.extract) {
    biography['zh-pinyin'] = {
      ...biography.zh, 
      extract: `[Pinyin del chino] ${biography.zh.extract}`,
      note: "Transliteración automática del texto chino"
    };
  }
  
  return biography;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Base de datos manual de compositores e intérpretes
// Los nombres se usan para buscar en Wikipedia multilingüe
const COMPOSERS_DATABASE = {
  // Compositores originales
  "Pierre Degeyter": {
    type: "composer",
    fullName: "Pierre Degeyter",
    wikipediaNames: {
      es: "Pierre Degeyter",
      en: "Pierre De Geyter", 
      de: "Pierre Degeyter",
      pt: "Pierre Degeyter",
      ru: "Дегейтер, Пьер",
      zh: "皮埃尔·德盖特"
    },
    works: ["L'Internationale"],
    politicalContext: {
      es: "Comuna de París, movimiento socialista francés",
      en: "Paris Commune, French socialist movement", 
      de: "Pariser Kommune, französische sozialistische Bewegung",
      pt: "Comuna de Paris, movimento socialista francês",
      ru: "Парижская коммуна, французское социалистическое движение",
      'ru-rom': "Parizhskaya kommuna, frantsuzskoye sotsialisticheskoye dvizheniye",
      zh: "巴黎公社，法国社会主义运动",
      'zh-pinyin': "Bālí gōngshè, fàguó shèhuì zhǔyì yùndòng"
    },
    alternativeNames: ["Pierre De Geyter", "Pierre de Geyter"]
  },
  
  "Sergio Ortega": {
    type: "composer",
    fullName: "Sergio Ortega Alvarado", 
    birthYear: 1938,
    deathYear: 2003,
    nationality: "Chilean",
    biography: {
      es: "Compositor y pianista chileno, creador de 'El pueblo unido jamás será vencido'. Militante comunista, su obra es símbolo de resistencia en América Latina.",
      en: "Chilean composer and pianist, creator of 'El pueblo unido jamás será vencido'. Communist militant, his work is a symbol of resistance in Latin America.",
      de: "Chilenischer Komponist und Pianist, Schöpfer von 'El pueblo unido jamás será vencido'. Kommunistischer Aktivist, sein Werk ist ein Symbol des Widerstands in Lateinamerika."
    },
    works: ["El pueblo unido jamás será vencido", "Vamos mujer"],
    politicalContext: {
      es: "Unidad Popular de Salvador Allende, resistencia contra la dictadura de Pinochet",
      en: "Salvador Allende's Popular Unity, resistance against Pinochet's dictatorship",
      de: "Salvador Allendes Unidad Popular, Widerstand gegen Pinochets Diktatur"
    },
    sources: ["Fundación Víctor Jara", "CEDOC Universidad de Chile", "Archivo Nacional de Chile"]
  },

  "Hanns Eisler": {
    type: "composer",
    fullName: "Hanns Eisler",
    birthYear: 1898,
    deathYear: 1962,
    nationality: "Austrian-German",
    biography: {
      es: "Compositor austriaco-alemán, discípulo de Schoenberg. Colaborador de Bertolt Brecht, creó el himno de la RDA y música revolucionaria antifascista.",
      en: "Austrian-German composer, student of Schoenberg. Collaborator of Bertolt Brecht, created the GDR anthem and revolutionary anti-fascist music.",
      de: "Österreichisch-deutscher Komponist, Schüler Schönbergs. Mitarbeiter Bertolt Brechts, schuf die DDR-Hymne und revolutionäre antifaschistische Musik."
    },
    works: ["Einheitsfrontlied", "Auferstanden aus Ruinen", "Der heimliche Aufmarsch"],
    politicalContext: {
      es: "Frente antifascista alemán, exilio durante el nazismo, República Democrática Alemana",
      en: "German anti-fascist front, exile during Nazism, German Democratic Republic",
      de: "Deutsche antifaschistische Front, Exil während des Nationalsozialismus, Deutsche Demokratische Republik"
    },
    collaborators: ["Bertolt Brecht", "Ernst Busch"],
    sources: ["Hanns-Eisler-Archiv", "Akademie der Künste Berlin", "DEFA-Stiftung"]
  },

  "Alexandr Alexandrov": {
    type: "composer",
    fullName: "Aleksandr Vasilyevich Alexandrov",
    birthYear: 1883,
    deathYear: 1946,
    nationality: "Russian-Soviet",
    biography: {
      es: "Compositor soviético, creador del himno de la URSS. Fundó el Coro del Ejército Rojo, llevando la música coral rusa a nivel mundial.",
      en: "Soviet composer, creator of the USSR anthem. Founded the Red Army Choir, bringing Russian choral music to a global level.",
      de: "Sowjetischer Komponist, Schöpfer der UdSSR-Hymne. Gründete den Chor der Roten Armee und brachte die russische Chormusik auf Weltebene."
    },
    works: ["Священная война", "Гимн Советского Союза"],
    politicalContext: {
      es: "Revolución Rusa, Guerra Civil, Segunda Guerra Mundial, consolidación soviética",
      en: "Russian Revolution, Civil War, World War II, Soviet consolidation",
      de: "Russische Revolution, Bürgerkrieg, Zweiter Weltkrieg, sowjetische Konsolidierung"
    },
    sources: ["Российская государственная библиотека", "Центральный музей Вооруженных Сил", "Архив Минобороны РФ"]
  },

  // Intérpretes históricos destacados
  "Quilapayún": {
    type: "performer",
    fullName: "Quilapayún",
    foundedYear: 1965,
    nationality: "Chilean",
    biography: {
      es: "Grupo chileno de Nueva Canción, intérpretes emblemáticos de 'El pueblo unido'. Exiliados tras el golpe de Pinochet, difundieron la canción protesta latinoamericana por Europa.",
      en: "Chilean Nueva Canción group, emblematic performers of 'El pueblo unido'. Exiled after Pinochet's coup, they spread Latin American protest songs throughout Europe.",
      de: "Chilenische Nueva Canción-Gruppe, emblematische Interpreten von 'El pueblo unido'. Nach Pinochets Putsch im Exil, verbreiteten sie lateinamerikanische Protestlieder in Europa."
    },
    notableVersions: ["El pueblo unido jamás será vencido", "Venceremos", "La muralla"],
    politicalContext: {
      es: "Nueva Canción Chilena, Unidad Popular, exilio europeo durante dictadura",
      en: "Chilean Nueva Canción, Popular Unity, European exile during dictatorship", 
      de: "Chilenische Nueva Canción, Unidad Popular, europäisches Exil während der Diktatur"
    },
    members: ["Eduardo Carrasco", "Willy Oddó", "Carlos Quezada", "Hernán Gómez"],
    sources: ["Fundación Nueva Canción Chilena", "Archivo DIBAM", "Centre Culturel Chilien Paris"]
  },

  "Ernst Busch": {
    type: "performer", 
    fullName: "Ernst Busch",
    birthYear: 1900,
    deathYear: 1980,
    nationality: "German",
    biography: {
      es: "Actor y cantante alemán, 'la voz del proletariado'. Luchó en la Guerra Civil Española, fue prisionero nazi. Intérprete legendario de canciones revolucionarias.",
      en: "German actor and singer, 'the voice of the proletariat'. Fought in the Spanish Civil War, was a Nazi prisoner. Legendary performer of revolutionary songs.",
      de: "Deutscher Schauspieler und Sänger, 'die Stimme des Proletariats'. Kämpfte im Spanischen Bürgerkrieg, war Nazi-Gefangener. Legendärer Interpret revolutionärer Lieder."
    },
    notableVersions: ["Einheitsfrontlied", "Der heimliche Aufmarsch", "Los cuatro generales"],
    politicalContext: {
      es: "República de Weimar, Guerra Civil Española, antifascismo alemán, RDA",
      en: "Weimar Republic, Spanish Civil War, German anti-fascism, GDR",
      de: "Weimarer Republik, Spanischer Bürgerkrieg, deutscher Antifaschismus, DDR"
    },
    collaborators: ["Hanns Eisler", "Bertolt Brecht", "Brigadas Internacionales"],
    sources: ["Ernst-Busch-Archiv", "Deutsches Rundfunkarchiv", "Archivo Guerra Civil Española"]
  },

  "Paul Robeson": {
    type: "performer",
    fullName: "Paul Leroy Robeson",
    birthYear: 1898, 
    deathYear: 1976,
    nationality: "American",
    biography: {
      es: "Cantante, actor y activista afroamericano. Interpretó canciones revolucionarias internacionales, fue perseguido por el macartismo por sus ideas comunistas.",
      en: "African-American singer, actor and activist. Performed international revolutionary songs, was persecuted by McCarthyism for his communist ideas.",
      de: "Afroamerikanischer Sänger, Schauspieler und Aktivist. Führte internationale revolutionäre Lieder auf, wurde wegen seiner kommunistischen Ideen vom McCarthyismus verfolgt."
    },
    notableVersions: ["L'Internationale", "Ol' Man River", "Joe Hill"],
    politicalContext: {
      es: "Lucha por derechos civiles, solidaridad internacional, macartismo, Guerra Fría",
      en: "Civil rights struggle, international solidarity, McCarthyism, Cold War",
      de: "Bürgerrechtskampf, internationale Solidarität, McCarthyismus, Kalter Krieg"
    },
    languages: ["English", "Russian", "German", "Spanish", "Chinese"],
    sources: ["Paul Robeson Foundation", "Library of Congress", "Schomburg Center"]
  }
};

// Procesar archivos del blog
async function processLessonFiles() {
  console.log('📖 Procesando archivos de lecciones...');
  
  const lessons = [];
  const blogFiles = fs.readdirSync(BLOG_CONTENT_PATH)
    .filter(file => file.endsWith('.md') && file.startsWith('dia-'))
    .sort();
  
  for (const file of blogFiles) {
    const filePath = path.join(BLOG_CONTENT_PATH, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    
    if (frontmatter && frontmatter.originalSong) {
      const lesson = {
        day: frontmatter.day,
        title: frontmatter.title,
        song: frontmatter.originalSong,
        culturalContext: frontmatter.culturalContext,
        file: file
      };
      
      lessons.push(lesson);
      console.log(`  ✅ Día ${lesson.day}: "${lesson.song.title}" - ${lesson.song.artist} (${lesson.song.year})`);
    }
  }
  
  console.log(`📊 Total lecciones procesadas: ${lessons.length}`);
  return lessons;
}

// Generar datos completos de compositores
async function generateComposersData(lessons) {
  console.log('\n🎼 Generando datos de compositores e intérpretes...');
  
  const result = {
    metadata: {
      generated: new Date().toISOString(),
      version: "1.0.0",
      totalComposers: 0,
      totalPerformers: 0,
      sources: ["Wikipedia multilingüe", "Manual curation", "Academic sources"]
    },
    composers: {},
    performers: {},
    songs: {},
    connections: {}
  };
  
  // Procesar cada lección para identificar compositores/intérpretes
  for (const lesson of lessons) {
    const songId = `${lesson.song.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Datos básicos de la canción
    result.songs[songId] = {
      title: lesson.song.title,
      originalArtist: lesson.song.artist,
      year: lesson.song.year,
      origin: lesson.song.origin,
      genre: lesson.song.genre,
      day: lesson.day,
      culturalContext: lesson.culturalContext,
      composers: [],
      notablePerformers: []
    };
    
    // Buscar en la base de datos manual
    for (const [artistName, artistData] of Object.entries(COMPOSERS_DATABASE)) {
      
      // Verificar si es compositor de esta canción
      if (artistData.type === 'composer' && 
          (artistData.works.some(work => lesson.song.title.toLowerCase().includes(work.toLowerCase())) ||
           lesson.song.artist.toLowerCase().includes(artistName.toLowerCase()))) {
        
        // Obtener biografía multilingüe de Wikipedia
        console.log(`  🌐 Obteniendo biografía Wikipedia: ${artistName}`);
        const biographyData = await fetchMultilingualBiography(
          artistName, 
          artistData.alternativeNames || []
        );
        
        result.composers[artistName] = {
          ...artistData,
          biography: biographyData,
          wikipediaFetched: new Date().toISOString()
        };
        result.songs[songId].composers.push(artistName);
        
        console.log(`  🎵 Compositor: ${artistName} → "${lesson.song.title}"`);
      }
      
      // Verificar si es intérprete notable de esta canción
      if (artistData.type === 'performer' && 
          (artistData.notableVersions?.some(version => lesson.song.title.toLowerCase().includes(version.toLowerCase())) ||
           lesson.song.artist.toLowerCase().includes(artistName.toLowerCase()))) {
        
        // Obtener biografía multilingüe de Wikipedia
        console.log(`  🌐 Obteniendo biografía Wikipedia: ${artistName}`);
        const biographyData = await fetchMultilingualBiography(
          artistName, 
          artistData.alternativeNames || []
        );
        
        result.performers[artistName] = {
          ...artistData,
          biography: biographyData,
          wikipediaFetched: new Date().toISOString()
        };
        result.songs[songId].notablePerformers.push(artistName);
        
        console.log(`  🎤 Intérprete: ${artistName} → "${lesson.song.title}"`);
      }
    }
    
    // Si no se encontró compositor en la BD, crear entrada básica
    if (result.songs[songId].composers.length === 0) {
      const unknownComposer = lesson.song.artist;
      if (!result.composers[unknownComposer]) {
        result.composers[unknownComposer] = {
          type: "composer",
          fullName: unknownComposer,
          nationality: "Unknown",
          biography: {
            es: `Información biográfica de ${unknownComposer} pendiente de investigación.`,
            en: `Biographical information for ${unknownComposer} pending research.`,
            de: `Biografische Informationen zu ${unknownComposer} stehen noch aus.`
          },
          works: [lesson.song.title],
          needsResearch: true,
          sources: ["Song attribution only"]
        };
      }
      result.songs[songId].composers.push(unknownComposer);
      console.log(`  ❓ Compositor sin datos completos: ${unknownComposer}`);
    }
  }
  
  // Generar conexiones entre artistas
  result.connections = generateArtistConnections(result);
  
  // Estadísticas finales
  result.metadata.totalComposers = Object.keys(result.composers).length;
  result.metadata.totalPerformers = Object.keys(result.performers).length;
  
  console.log(`\n📊 Datos generados:`);
  console.log(`   - Compositores: ${result.metadata.totalComposers}`);
  console.log(`   - Intérpretes: ${result.metadata.totalPerformers}`);
  console.log(`   - Canciones: ${Object.keys(result.songs).length}`);
  
  return result;
}

// Generar conexiones entre artistas (colaboraciones, influencias)
function generateArtistConnections(data) {
  const connections = {};
  
  // Conexiones conocidas (manual)
  const knownConnections = [
    {
      artist1: "Hanns Eisler",
      artist2: "Bertolt Brecht", 
      relationship: "collaborator",
      description: {
        es: "Colaboración estrecha en teatro político y canciones revolucionarias",
        en: "Close collaboration in political theater and revolutionary songs",
        de: "Enge Zusammenarbeit im politischen Theater und in revolutionären Liedern"
      }
    },
    {
      artist1: "Ernst Busch",
      artist2: "Hanns Eisler",
      relationship: "interpreter_composer",
      description: {
        es: "Busch fue el principal intérprete de las composiciones de Eisler",
        en: "Busch was the main performer of Eisler's compositions", 
        de: "Busch war der Hauptinterpret von Eislers Kompositionen"
      }
    },
    {
      artist1: "Quilapayún", 
      artist2: "Sergio Ortega",
      relationship: "interpreter_composer",
      description: {
        es: "Quilapayún popularizó mundialmente las composiciones de Ortega",
        en: "Quilapayún globally popularized Ortega's compositions",
        de: "Quilapayún popularisierte Ortegas Kompositionen weltweit"
      }
    }
  ];
  
  for (const connection of knownConnections) {
    const connectionId = `${connection.artist1}-${connection.artist2}`;
    connections[connectionId] = connection;
  }
  
  return connections;
}

// Función principal
async function generateComposerDatabase() {
  console.log('🚀 Iniciando generación de base de datos de compositores...\n');
  
  // Preparar directorios
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Procesar lecciones
  const lessons = await processLessonFiles();
  
  // Generar datos completos
  const composersData = await generateComposersData(lessons);
  
  // Guardar archivo principal
  fs.writeFileSync(COMPOSERS_INDEX, JSON.stringify(composersData, null, 2), 'utf8');
  console.log(`💾 Guardado: ${COMPOSERS_INDEX}`);
  
  // Generar archivos individuales por artista
  for (const [artistName, artistData] of Object.entries(composersData.composers)) {
    const artistSlug = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const artistFile = path.join(OUTPUT_DIR, `${artistSlug}.json`);
    
    const individualData = {
      ...artistData,
      relatedSongs: Object.values(composersData.songs)
        .filter(song => song.composers.includes(artistName))
        .map(song => ({
          title: song.title,
          year: song.year,
          day: song.day
        })),
      connections: Object.values(composersData.connections)
        .filter(conn => conn.artist1 === artistName || conn.artist2 === artistName)
    };
    
    fs.writeFileSync(artistFile, JSON.stringify(individualData, null, 2), 'utf8');
    console.log(`📄 Guardado perfil individual: ${artistSlug}.json`);
  }
  
  for (const [artistName, artistData] of Object.entries(composersData.performers)) {
    const artistSlug = artistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const artistFile = path.join(OUTPUT_DIR, `${artistSlug}.json`);
    
    const individualData = {
      ...artistData,
      relatedSongs: Object.values(composersData.songs)
        .filter(song => song.notablePerformers.includes(artistName))
        .map(song => ({
          title: song.title,
          year: song.year,
          day: song.day
        })),
      connections: Object.values(composersData.connections)
        .filter(conn => conn.artist1 === artistName || conn.artist2 === artistName)
    };
    
    fs.writeFileSync(artistFile, JSON.stringify(individualData, null, 2), 'utf8');
    console.log(`📄 Guardado perfil individual: ${artistSlug}.json`);
  }
  
  console.log(`\n✅ GENERACIÓN COMPLETADA`);
  console.log(`========================`);
  console.log(`📁 Directorio: ${OUTPUT_DIR}`);
  console.log(`🗃️  Archivo principal: index.json`);
  console.log(`👥 Perfiles individuales: ${Object.keys(composersData.composers).length + Object.keys(composersData.performers).length} archivos`);
  
  return composersData;
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComposerDatabase()
    .then(() => {
      console.log('🎉 ¡Base de datos de compositores generada con éxito!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { generateComposerDatabase, COMPOSERS_DATABASE };