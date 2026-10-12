import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Blog, User } from '../../api/types.ts';
import { setToken } from '../../auth/tokenStorage.ts';
import { API_URL } from '../../config.ts';
import {
  AUTHOR,
  AUTHOR_USER,
  makeBlog,
  makeUser,
  paginatedBlogsHandler,
  paginatedHandler,
} from '../../mocks/fixtures.ts';
import { server } from '../../mocks/server.ts';
import { renderRoute } from '../../test/renderRoute.tsx';
import { formatBlogDate } from '../blogs/format.ts';

const url = (path: string) => `${API_URL}${path}`;

/** `count` authors, newest first: "Author 1" to "Author <count>". */
function makeUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => makeUser(i + 1));
}

/** The author exists and their blogs come back as a plain array. */
function authorReturns(author: User, blogs: Blog[]) {
  server.use(
    http.get(url(`/api/users/${author.id}/`), () => HttpResponse.json(author)),
    http.get(url(`/api/users/${author.id}/blogs/`), () =>
      HttpResponse.json(blogs),
    ),
  );
}

function logIn() {
  setToken('t0k3n');
  server.use(
    http.get(url('/api/auth/me/'), () =>
      HttpResponse.json({
        id: 1,
        username: 'demo',
        is_staff: true,
        author_id: AUTHOR.id,
      }),
    ),
  );
}

/** Links and buttons that would change an author. */
function authorWriteControls() {
  return [
    ...screen.queryAllByRole('link', { name: /new|add|edit|delete/i }),
    ...screen.queryAllByRole('button', { name: /new|add|edit|delete/i }),
  ];
}

describe('UserListPage', () => {
  it('lists authors with name, @username and join date', async () => {
    server.use(paginatedHandler('/api/users/', [AUTHOR_USER, makeUser(3)]));
    renderRoute('/users');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Authors' }),
    ).toBeInTheDocument();
    const [ada, ...others] = await screen.findAllByRole('article');
    expect(others).toHaveLength(1);
    if (!ada) throw new Error('no author rows');
    expect(
      within(ada).getByRole('link', { name: 'Ada Lovelace' }),
    ).toHaveAttribute('href', `/users/${AUTHOR.id}`);
    expect(ada).toHaveTextContent('@ada');
    expect(ada).toHaveTextContent(`Joined ${formatBlogDate('2026-01-15')}`);
    // Personal data stays out of the demo.
    expect(screen.queryByText(/ada@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/690/)).not.toBeInTheDocument();
  });

  it('pages with ?page=', async () => {
    server.use(paginatedHandler('/api/users/', makeUsers(12)));
    const { router } = renderRoute('/users');

    const pagination = await screen.findByRole('navigation', {
      name: 'Pagination',
    });
    expect(pagination).toHaveTextContent('Page 1 of 2');
    expect(screen.getAllByRole('article')).toHaveLength(10);

    await userEvent.click(
      within(pagination).getByRole('link', { name: 'Next' }),
    );
    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    expect(
      await screen.findByRole('link', { name: 'Author 12' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('pages a plain array on the client', async () => {
    server.use(
      http.get(url('/api/users/'), () => HttpResponse.json(makeUsers(12))),
    );
    renderRoute('/users?page=2');

    expect(
      await screen.findByRole('navigation', { name: 'Pagination' }),
    ).toHaveTextContent('Page 2 of 2');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('goes back to page 1 past the last page', async () => {
    server.use(paginatedHandler('/api/users/', makeUsers(3)));
    const { router } = renderRoute('/users?page=9');
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await screen.findAllByRole('article')).toHaveLength(3);
  });

  it('shows an empty state', async () => {
    server.use(http.get(url('/api/users/'), () => HttpResponse.json([])));
    renderRoute('/users');
    expect(
      await screen.findByRole('heading', { name: 'No authors yet' }),
    ).toBeInTheDocument();
  });

  it('shows an error with a retry', async () => {
    let fail = true;
    server.use(
      http.get(url('/api/users/'), () =>
        fail
          ? HttpResponse.json({ detail: 'Not allowed.' }, { status: 403 })
          : HttpResponse.json([AUTHOR_USER]),
      ),
    );
    renderRoute('/users');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Authors didn't load");
    fail = false;
    await userEvent.click(
      within(alert).getByRole('button', { name: 'Try again' }),
    );
    expect(
      await screen.findByRole('link', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
  });

  it('has no controls to change authors, even logged in', async () => {
    logIn();
    server.use(paginatedHandler('/api/users/', [AUTHOR_USER]));
    renderRoute('/users');
    await screen.findByRole('link', { name: 'Ada Lovelace' });
    expect(authorWriteControls()).toEqual([]);
  });
});

describe('UserDetailPage', () => {
  it('shows the author and their blogs, newest first', async () => {
    authorReturns(AUTHOR_USER, [
      makeBlog(1, { title: 'Older', created_at: '2026-02-01' }),
      makeBlog(2, { title: 'Newer', created_at: '2026-03-01' }),
    ]);
    renderRoute(`/users/${AUTHOR.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/@ada · Joined/)).toHaveTextContent(
      `@ada · Joined ${formatBlogDate('2026-01-15')}`,
    );
    const titles = (await screen.findAllByRole('heading', { level: 3 })).map(
      (heading) => heading.textContent,
    );
    expect(titles).toEqual(['Newer', 'Older']);
    expect(screen.getByRole('link', { name: 'Newer' })).toHaveAttribute(
      'href',
      '/blogs/2',
    );
    expect(screen.queryByText(/ada@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText(/690/)).not.toBeInTheDocument();
  });

  it('pages their blogs with ?page=', async () => {
    const blogs = Array.from({ length: 12 }, (_, i) =>
      makeBlog(100 + i, {
        title: `Blog ${i + 1}`,
        created_at: `2026-03-${String(12 - i).padStart(2, '0')}`,
      }),
    );
    server.use(
      http.get(url(`/api/users/${AUTHOR.id}/`), () =>
        HttpResponse.json(AUTHOR_USER),
      ),
      paginatedHandler(`/api/users/${AUTHOR.id}/blogs/`, blogs),
    );
    const { router } = renderRoute(`/users/${AUTHOR.id}`);

    const pagination = await screen.findByRole('navigation', {
      name: 'Pagination',
    });
    expect(pagination).toHaveTextContent('Page 1 of 2');
    await userEvent.click(
      within(pagination).getByRole('link', { name: 'Next' }),
    );
    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    expect(
      await screen.findByRole('link', { name: 'Blog 12' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/users/${AUTHOR.id}`);
  });

  it('goes back to their first page of blogs past the last page', async () => {
    server.use(
      http.get(url(`/api/users/${AUTHOR.id}/`), () =>
        HttpResponse.json(AUTHOR_USER),
      ),
      paginatedHandler(`/api/users/${AUTHOR.id}/blogs/`, [makeBlog(5)]),
    );
    const { router } = renderRoute(`/users/${AUTHOR.id}?page=9`);

    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(router.state.location.pathname).toBe(`/users/${AUTHOR.id}`);
    expect(
      await screen.findByRole('link', { name: 'Blog 5' }),
    ).toBeInTheDocument();
  });

  it('shows "No blogs yet" for an author without blogs', async () => {
    authorReturns(makeUser(3), []);
    renderRoute('/users/3');
    expect(
      await screen.findByRole('heading', { name: 'No blogs yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Author 3' }),
    ).toBeInTheDocument();
  });

  it('shows not-found for an unknown author', async () => {
    server.use(
      http.get(url('/api/users/:id/'), () =>
        HttpResponse.json(
          { detail: 'No User matches the given query.' },
          { status: 404 },
        ),
      ),
    );
    renderRoute('/users/999999');
    expect(
      await screen.findByRole('heading', { name: 'Author not found' }),
    ).toBeInTheDocument();
  });

  it('shows not-found for a non-numeric id without calling the API', async () => {
    let called = false;
    server.use(
      http.get(url('/api/users/:id/'), () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    renderRoute('/users/abc');
    expect(
      await screen.findByRole('heading', { name: 'Author not found' }),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('shows an error with a retry for other failures', async () => {
    let fail = true;
    server.use(
      http.get(url(`/api/users/${AUTHOR.id}/`), () =>
        fail
          ? HttpResponse.json({ detail: 'Not allowed.' }, { status: 403 })
          : HttpResponse.json(AUTHOR_USER),
      ),
      http.get(url(`/api/users/${AUTHOR.id}/blogs/`), () =>
        HttpResponse.json([]),
      ),
    );
    renderRoute(`/users/${AUTHOR.id}`);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("This author didn't load");
    fail = false;
    await userEvent.click(
      within(alert).getByRole('button', { name: 'Try again' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
  });

  it('has no controls to change the author, even logged in', async () => {
    logIn();
    authorReturns(AUTHOR_USER, []);
    renderRoute(`/users/${AUTHOR.id}`);
    await screen.findByRole('heading', { name: 'No blogs yet' });
    expect(authorWriteControls()).toEqual([]);
  });
});

describe('author links', () => {
  it('open the right profile from a blog card', async () => {
    server.use(paginatedBlogsHandler([makeBlog(5)]));
    authorReturns(AUTHOR_USER, [makeBlog(5)]);
    const { router } = renderRoute('/blogs');

    const card = await screen.findByRole('article');
    await userEvent.click(
      within(card).getByRole('link', { name: 'Ada Lovelace' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/users/${AUTHOR.id}`);
  });

  it('open the right profile from the blog detail page', async () => {
    server.use(
      http.get(url('/api/blogs/5/'), () => HttpResponse.json(makeBlog(5))),
    );
    authorReturns(AUTHOR_USER, [makeBlog(5)]);
    const { router } = renderRoute('/blogs/5');

    await screen.findByRole('heading', { level: 1, name: 'Blog 5' });
    await userEvent.click(screen.getByRole('link', { name: 'Ada Lovelace' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/users/${AUTHOR.id}`);
  });

  it("don't show the previous author's blogs on another profile", async () => {
    const grace = makeUser(8, { first_name: 'Grace', last_name: 'Hopper' });
    authorReturns(AUTHOR_USER, [makeBlog(5, { title: "Ada's blog" })]);
    server.use(
      http.get(url('/api/users/8/'), () => HttpResponse.json(grace)),
      http.get(url('/api/users/8/blogs/'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json([]);
      }),
    );
    const { router } = renderRoute(`/users/${AUTHOR.id}`);
    await screen.findByRole('link', { name: "Ada's blog" });

    await router.navigate('/users/8');
    await screen.findByRole('heading', { level: 1, name: 'Grace Hopper' });
    expect(
      screen.queryByRole('link', { name: "Ada's blog" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'No blogs yet' }),
    ).toBeInTheDocument();
  });
});
