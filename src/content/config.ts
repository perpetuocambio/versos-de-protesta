import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    // Tipo específico de contenido
    contentType: z.enum(['lesson', 'song-analysis', 'grammar', 'cultural']).default('lesson'),
    // Día de la lección
    day: z.number().optional(),
    // Idiomas principales del contenido
    primaryLanguages: z.array(z.string()),
    // Nivel de dificultad
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    // Tags temáticos
    tags: z.array(z.string()).optional(),
    // Canción original si aplica
    originalSong: z.object({
      title: z.string(),
      artist: z.string().optional(),
      year: z.number().optional(),
      origin: z.string().optional()
    }).optional(),
    // Idiomas incluidos en el análisis
    languagesIncluded: z.array(z.string()).default(['es', 'en', 'de', 'pt', 'ru', 'zh']),
    // Temas gramaticales tratados
    grammarTopics: z.array(z.string()).optional(),
    // Dificultad musical
    musicalComplexity: z.enum(['simple', 'intermediate', 'complex']).optional()
  }),
});

const grammar = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    // Categoría gramatical principal
    category: z.enum([
      'tiempos-verbales', 
      'pronombres', 
      'casos-gramaticales', 
      'adjetivos', 
      'adverbios', 
      'sintaxis', 
      'fonetica',
      'articulos-determinantes',
      'preposiciones',
      'conjunciones-conectores',
      'numeros-cuantificadores',  
      'morfologia-formacion',
      'particulas-funcionales'
    ]),
    // Subcategoría específica
    subcategory: z.string().optional(),
    // Nivel de dificultad
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    // Tiempo estimado de estudio
    estimatedTime: z.string().default('30-45 min'),
    // Idiomas incluidos en el análisis
    languagesIncluded: z.array(z.string()).default(['es', 'en', 'de', 'pt', 'ru', 'zh']),
    // Conceptos gramaticales específicos
    grammarConcepts: z.array(z.string()),
    // Prerequisitos (otros artículos que debería conocer)
    prerequisites: z.array(z.string()).optional(),
    // Palabras clave para búsqueda
    keywords: z.array(z.string()).optional(),
    // Fórmula gramatical principal
    mainFormula: z.string().optional(),
    // Si incluye línea temporal visual
    hasTimeline: z.boolean().default(false),
    // Ejemplos principales por idioma
    examples: z.object({
      español: z.string(),
      english: z.string(),
      deutsch: z.string(),
      português: z.string(),
      русский: z.string(),
      中文: z.string()
    }).optional(),
    // Tags temáticos
    tags: z.array(z.string()).optional()
  }),
});

export const collections = { blog, grammar };