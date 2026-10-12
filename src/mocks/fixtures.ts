import { http, HttpResponse } from 'msw';
import type { Blog } from '../api/types.ts';
import { API_URL } from '../config.ts';

export const AUTHOR = {
  id: 7,
  username: 'ada',
  first_name: 'Ada',
  last_name: 'Lovelace',
};

export function makeBlog(id: number, overrides: Partial<Blog> = {}): Blog {
  return {
    id,
    user: AUTHOR.id,
    author: AUTHOR,
    title: `Blog ${id}`,
    content: `Content of blog ${id}.`,
    created_at: '2026-01-01',
    ...overrides,
  };
}

/** `count` blogs, newest first: "Blog 1" (newest) to "Blog <count>". */
export function makeBlogs(count: number): Blog[] {
  return Array.from({ length: count }, (_, i) =>
    makeBlog(100 + i, {
      title: `Blog ${i + 1}`,
      created_at: `2026-03-${String(count - i).padStart(2, '0')}`,
    }),
  );
}

/**
 * `GET /api/blogs/` serving `blogs` like DRF's page-number pagination:
 * 10 per page, `?page=N`, 404 "Invalid page." outside the pages.
 * Pass a function to serve blogs that change between requests.
 */
export function paginatedBlogsHandler(
  source: Blog[] | (() => Blog[]),
  pageSize = 10,
) {
  return http.get(`${API_URL}/api/blogs/`, ({ request }) => {
    const blogs = typeof source === 'function' ? source() : source;
    const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
    const pages = Math.max(1, Math.ceil(blogs.length / pageSize));
    if (!Number.isInteger(page) || page < 1 || page > pages) {
      return HttpResponse.json({ detail: 'Invalid page.' }, { status: 404 });
    }
    const pageUrl = (n: number) =>
      n === 1 ? `${API_URL}/api/blogs/` : `${API_URL}/api/blogs/?page=${n}`;
    return HttpResponse.json({
      count: blogs.length,
      next: page < pages ? pageUrl(page + 1) : null,
      previous: page > 1 ? pageUrl(page - 1) : null,
      results: blogs.slice((page - 1) * pageSize, page * pageSize),
    });
  });
}
