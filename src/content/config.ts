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

export const collections = { blog };