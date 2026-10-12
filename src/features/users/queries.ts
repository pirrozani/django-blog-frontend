export const userKeys = {
  all: ['users'] as const,
  /** An author's blogs (`/api/users/<id>/blogs/`), every page. */
  blogs: (id: number) => [...userKeys.all, 'blogs', id] as const,
};
