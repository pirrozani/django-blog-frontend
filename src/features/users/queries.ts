import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUser, listUserBlogs, listUsers } from '../../api/users.ts';
import { newestFirst } from '../blogs/order.ts';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (page: number) => [...userKeys.lists(), page] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  /** An author's blogs (`/api/users/<id>/blogs/`), every page. */
  blogs: (id: number) => [...userKeys.all, 'blogs', id] as const,
  blogsPage: (id: number, page: number) =>
    [...userKeys.blogs(id), page] as const,
};

/** Page `page` of the authors. The previous page stays up while it loads. */
export function useUsers(page: number) {
  return useQuery({
    queryKey: userKeys.list(page),
    queryFn: ({ signal }) => listUsers(page, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: ({ signal }) => getUser(id, { signal }),
  });
}

/** Page `page` of an author's blogs, newest first. */
export function useUserBlogs(id: number, page: number) {
  return useQuery({
    queryKey: userKeys.blogsPage(id, page),
    queryFn: ({ signal }) => listUserBlogs(id, page, { signal }),
    select: newestFirst,
    // Keep the previous page up while paging, but never another author's.
    placeholderData: (previous, previousQuery) => {
      const sameAuthor = userKeys
        .blogs(id)
        .every((part, i) => previousQuery?.queryKey[i] === part);
      return sameAuthor ? previous : undefined;
    },
  });
}
