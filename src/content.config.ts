import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './data/blog' }),
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    published: z.string(),
    model: z.string().optional(),
  }),
});

export const collections = { blog };
