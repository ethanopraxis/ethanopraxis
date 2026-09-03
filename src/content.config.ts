import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const dieu = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dieu' }),
  schema: z.object({
    phap: z.enum(['kien-khiem', 'nhu-tinh']),
    kind: z.enum(['dieu', 'ky', 'nguyen-tac', 'tran', 'that-bai',
                  'menh-lenh', 'khau-quyet', 'quy-luat', 'buoc']),
    quyen: z.number(),
    quyenTitle: z.string(),
    order: z.number(),
    number: z.number().optional(),
    title: z.string(),
    essence: z.string(),
    saiKhi: z.string().optional(),
    kiemBang: z.string().optional(),
  }),
});

const items = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/items' }),
  schema: z.object({
    type: z.enum(['video', 'short', 'series-episode', 'course-lesson']),
    title: z.string().optional(),
    youtubeId: z.string().optional(),
    series: z.string().optional(),
    domain: reference('domains').optional(),
    method: z.array(z.string()).default([]),
    day: z.number().optional(),
    course: z.string().optional(),
    module: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

const domains = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/domains' }),
  schema: z.object({
    name: z.string(),
    viName: z.string(),
  }),
});

const wells = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wells' }),
  schema: z.object({
    domain: reference('domains'),
    startDate: z.coerce.date(),
    giaThuyet: z.string(),
    chiSo: z.string(),
    nganSach: z.string(),
    dieuKienDung: z.string(),
    verdict: z.enum(['co-nuoc', 'kho', 'pending']).default('pending'),
    verdictDate: z.coerce.date().optional(),
    verdictNote: z.string().optional(),
  }),
});

const goals = defineCollection({
  // `_`-prefixed files are templates, not goals: src/content/goals/*.md is
  // git-ignored except _example.md, so the loader must skip it.
  loader: glob({ pattern: '**/[!_]*.md', base: './src/content/goals' }),
  schema: z.object({
    cluster: z.string(),
    role: z.enum(['gieng-chinh', 'dia-hinh', 'duong-sinh', 'moi-truong']),
    tran: z.number().min(1).max(7),
    giaThuyet: z.string(), chiSo: z.string(),
    nganSach: z.string(), dieuKienDung: z.string(),
    nextReview: z.coerce.date(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { dieu, items, domains, wells, goals };
