import { z } from 'zod';

const httpUrl = z
  .string()
  .url()
  .max(1000)
  .refine((u) => /^https?:\/\//i.test(u), 'Ссылка должна начинаться с http(s)');
const isoDate = z.string().datetime({ offset: true });

export const taskInput = z.object({
  day: z.number().int().min(1).max(31),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(5000).default(''),
  instructions: z.string().max(5000).default(''),
  media_url: httpUrl.nullable().optional(),
  media_type: z.enum(['image', 'video']).nullable().optional(),
  cover_url: httpUrl.nullable().optional(),
  link_url: httpUrl.nullable().optional(),
  deadline: isoDate.nullable().optional(),
  publish_at: isoDate.nullable().optional(),
  is_published: z.boolean().default(false),
  unlock_override: z.enum(['force_unlock', 'force_lock']).nullable().optional(),
});
export const taskPatch = taskInput.partial();

export const settingsInput = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().max(64),
  total_days: z.number().int().min(1).max(31),
  tz_mode: z.enum(['calendar', 'user']),
  skip_weekends: z.boolean(),
});

export const fileRef = z.object({
  path: z.string().max(300),
  name: z.string().max(200),
  type: z.string().max(100),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
});
export const progressInput = z.object({
  status: z.enum(['in_progress', 'completed']),
  notes: z.string().max(10000),
  files: z.array(fileRef).max(5),
});

export const mergeInput = z.object({
  days: z
    .record(
      z.string().regex(/^\d{1,2}$/),
      z.object({
        status: z.enum(['in_progress', 'completed']),
        notes: z.string().max(10000),
        updatedAt: z.number(),
      }),
    )
    .refine((r) => Object.keys(r).length <= 31),
});

export const publicationInput = z.object({
  day: z.number().int().min(1).max(31),
  content: z.string().max(2000),
  visibility: z.enum(['feed', 'link']),
  mediaPath: z.string().max(300).nullable().optional(),
  removeMedia: z.boolean().optional(),
});

export const uploadInput = z.object({
  day: z.number().int().min(1).max(31),
  kind: z.enum(['private', 'public']),
  name: z.string().min(1).max(200),
  type: z.string().max(100),
  size: z.number().int().min(1),
});

export const ALLOWED = {
  private: { bucket: 'user-files', max: 10 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'] },
  public: { bucket: 'publication-media', max: 5 * 1024 * 1024, types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
} as const;
