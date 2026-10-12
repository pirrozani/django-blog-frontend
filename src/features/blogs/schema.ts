import { z } from 'zod';

export const TITLE_MAX_LENGTH = 200;

/** A blog's writable fields (`api/models/blog.py`); the author comes from the token. */
export const blogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title.')
    .max(
      TITLE_MAX_LENGTH,
      `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`,
    ),
  content: z.string().trim().min(1, 'Write some content.'),
});

export type BlogValues = z.infer<typeof blogSchema>;
