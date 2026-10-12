import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import type { Blog } from '../../api/types.ts';
import { setToken } from '../../auth/tokenStorage.ts';
import { API_URL } from '../../config.ts';
import {
  AUTHOR,
  makeBlog,
  makeBlogs,
  paginatedBlogsHandler,
} from '../../mocks/fixtures.ts';
import { server } from '../../mocks/server.ts';
import { renderRoute } from '../../test/renderRoute.tsx';
import { excerpt } from './format.ts';
import { newestFirst } from './order.ts';

const url = (path: string) => `${API_URL}${path}`;

/** The API as on backend main: DRF page-number pagination. */
function blogsReturn(blogs: Blog[]) {
  server.use(paginatedBlogsHandler(blogs));
}

/** An API that doesn't paginate: every blog in a plain, unordered array. */
function blogsReturnArray(blogs: Blog[]) {
  server.use(http.get(url('/api/blogs/'), () => HttpResponse.json(blogs)));
}

/** Logs in as the demo account, which writes as `AUTHOR` by default. */
function logIn(authorId: number | null = AUTHOR.id) {
  setToken('t0k3n');
  server.use(
    http.get(url('/api/auth/me/'), () =>
      HttpResponse.json({
        id: 1,
        username: 'demo',
        is_staff: false,
        author_id: authorId,
      }),
    ),
  );
}

/** Blog titles in the list, in order. */
async function listedTitles() {
  const list = await screen.findByRole('list');
  return within(list)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent);
}

const FIRST_TEN = Array.from({ length: 10 }, (_, i) => `Blog ${i + 1}`);

describe('BlogListPage', () => {
  it('shows the first 10 of 12 blogs and pages with ?page=', async () => {
    const pagesAsked: (string | null)[] = [];
    onTestFinished(() => server.events.removeAllListeners());
    server.events.on('request:start', ({ request }) => {
      const requested = new URL(request.url);
      if (requested.pathname === '/api/blogs/') {
        pagesAsked.push(requested.searchParams.get('page'));
      }
    });
    blogsReturn(makeBlogs(12));
    const { router } = renderRoute('/blogs');

    expect(await listedTitles()).toEqual(FIRST_TEN);
    const pagination = screen.getByRole('navigation', { name: 'Pagination' });
    expect(pagination).toHaveTextContent('Page 1 of 2');
    expect(
      within(pagination).getByRole('button', { name: 'Previous' }),
    ).toBeDisabled();

    await userEvent.click(
      within(pagination).getByRole('link', { name: 'Next' }),
    );

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    await waitFor(async () =>
      expect(await listedTitles()).toEqual(['Blog 11', 'Blog 12']),
    );
    expect(pagination).toHaveTextContent('Page 2 of 2');
    expect(
      within(pagination).getByRole('button', { name: 'Next' }),
    ).toBeDisabled();
    expect(pagesAsked).toEqual([null, '2']);
  });

  it('opens on the page in the URL', async () => {
    blogsReturn(makeBlogs(12));
    renderRoute('/blogs?page=2');
    expect(await listedTitles()).toEqual(['Blog 11', 'Blog 12']);
  });

  it.each(['?page=0', '?page=abc', '?page=1.5'])(
    'treats %s as page 1',
    async (search) => {
      blogsReturn(makeBlogs(12));
      renderRoute(`/blogs${search}`);
      expect(
        await screen.findByRole('navigation', { name: 'Pagination' }),
      ).toHaveTextContent('Page 1 of 2');
    },
  );

  it('goes back to page 1 past the last page', async () => {
    blogsReturn(makeBlogs(12));
    const { router } = renderRoute('/blogs?page=99');
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await listedTitles()).toEqual(FIRST_TEN);
  });

  it('links titles to the blog and authors to their profile', async () => {
    blogsReturn([makeBlog(5, { content: 'x'.repeat(500) })]);
    renderRoute('/blogs');

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('link', { name: 'Blog 5' })).toHaveAttribute(
      'href',
      '/blogs/5',
    );
    expect(
      within(card).getByRole('link', { name: 'Ada Lovelace' }),
    ).toHaveAttribute('href', `/users/${AUTHOR.id}`);
    expect(within(card).getByText(/^Authored by/)).toHaveTextContent(
      /^Authored by Ada Lovelace on /,
    );
    expect(within(card).getByText(/^x+…$/).textContent).toHaveLength(201);
    // One page: no pagination.
    expect(
      screen.queryByRole('navigation', { name: 'Pagination' }),
    ).not.toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    renderRoute('/blogs');
    expect(screen.getByText('Loading blogs…')).toBeInTheDocument();
  });

  it('shows an empty state without a write link when anonymous', async () => {
    renderRoute('/blogs');
    expect(
      await screen.findByRole('heading', { name: 'No blogs yet' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Write the first one' }),
    ).not.toBeInTheDocument();
  });

  it('offers "Write the first one" and "New blog" to a logged-in author', async () => {
    logIn();
    renderRoute('/blogs');
    expect(
      await screen.findByRole('link', { name: 'Write the first one' }),
    ).toHaveAttribute('href', '/blogs/new');
    expect(screen.getByRole('link', { name: 'New blog' })).toHaveAttribute(
      'href',
      '/blogs/new',
    );
  });

  it('offers no write links to an account without an author', async () => {
    logIn(null);
    renderRoute('/blogs');
    expect(
      await screen.findByRole('heading', { name: 'No blogs yet' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Write the first one' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'New blog' }),
    ).not.toBeInTheDocument();
  });

  it('shows an error with a retry that reloads the list', async () => {
    server.use(
      http.get(url('/api/blogs/'), () =>
        HttpResponse.json({ detail: 'Not allowed.' }, { status: 403 }),
      ),
    );
    renderRoute('/blogs');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Blogs didn't load");
    expect(alert).toHaveTextContent('Not allowed.');

    blogsReturn([makeBlog(1)]);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await listedTitles()).toEqual(['Blog 1']);
  });
});

describe('BlogListPage with an unpaginated API', () => {
  it('sorts the array newest first and pages it on the client', async () => {
    blogsReturnArray([...makeBlogs(12)].reverse());
    renderRoute('/blogs');
    expect(await listedTitles()).toEqual(FIRST_TEN);

    await userEvent.click(screen.getByRole('link', { name: 'Next' }));
    await waitFor(async () =>
      expect(await listedTitles()).toEqual(['Blog 11', 'Blog 12']),
    );
  });

  it('shows the last page past the end', async () => {
    blogsReturnArray(makeBlogs(12));
    renderRoute('/blogs?page=99');
    expect(
      await screen.findByRole('navigation', { name: 'Pagination' }),
    ).toHaveTextContent('Page 2 of 2');
  });
});

describe('BlogDetailPage', () => {
  const content = 'First line.\n\nSecond paragraph,\n  indented.';

  function blogReturns(id = 5) {
    server.use(
      http.get(url(`/api/blogs/${id}/`), () =>
        HttpResponse.json(makeBlog(id, { title: 'Hello there', content })),
      ),
    );
  }

  it('shows the full content with its line breaks', async () => {
    blogReturns();
    renderRoute('/blogs/5');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hello there' }),
    ).toBeInTheDocument();
    const body = screen.getByText(
      (_, element) =>
        element?.tagName === 'DIV' && element.textContent === content,
    );
    expect(body).toHaveClass('whitespace-pre-wrap');
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      `/users/${AUTHOR.id}`,
    );
    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it("hides Edit and Delete on another author's blog", async () => {
    logIn(99);
    blogReturns();
    renderRoute('/blogs/5');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hello there' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('shows Edit and Delete on your own blog', async () => {
    logIn();
    blogReturns();
    renderRoute('/blogs/5');

    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/blogs/5/edit',
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows an error with a retry for other failures', async () => {
    blogReturns();
    // Prepended, so the first request fails and the retry succeeds.
    server.use(
      http.get(
        url('/api/blogs/5/'),
        () => HttpResponse.json({ detail: 'Not allowed.' }, { status: 403 }),
        { once: true },
      ),
    );
    renderRoute('/blogs/5');

    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hello there' }),
    ).toBeInTheDocument();
  });

  it('shows a not-found state for a 404', async () => {
    renderRoute('/blogs/999999');
    expect(
      await screen.findByRole('heading', { name: 'Blog not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
  });

  it('shows not-found for a non-numeric id without calling the API', async () => {
    let called = false;
    server.use(
      http.get(url('/api/blogs/:id/'), () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    renderRoute('/blogs/abc');
    expect(
      await screen.findByRole('heading', { name: 'Blog not found' }),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });
});

describe('newestFirst', () => {
  it('sorts by date, then id, newest first', () => {
    const blogs = [
      makeBlog(1, { created_at: '2026-01-02' }),
      makeBlog(3, { created_at: '2026-01-01' }),
      makeBlog(2, { created_at: '2026-01-02' }),
    ];
    const sorted = newestFirst(blogs);
    expect(Array.isArray(sorted) && sorted.map((b) => b.id)).toEqual([2, 1, 3]);
  });
});

describe('excerpt', () => {
  it('flattens whitespace and keeps short text whole', () => {
    expect(excerpt('Hello\n\n  world')).toBe('Hello world');
  });

  it('cuts long text at a word', () => {
    expect(excerpt('aaaa bbbb cccc', 12)).toBe('aaaa bbbb…');
  });
});
