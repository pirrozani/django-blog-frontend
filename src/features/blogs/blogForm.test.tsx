import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Blog } from '../../api/types.ts';
import { setToken } from '../../auth/tokenStorage.ts';
import { API_URL } from '../../config.ts';
import {
  AUTHOR,
  makeBlog,
  paginatedBlogsHandler,
} from '../../mocks/fixtures.ts';
import { server } from '../../mocks/server.ts';
import { renderRoute } from '../../test/renderRoute.tsx';
import { blogSchema } from './schema.ts';

const url = (path: string) => `${API_URL}${path}`;

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

interface Sent {
  method: string;
  path: string;
  body: unknown;
}

/**
 * An in-memory blog API: list, detail, create, patch and delete, recording
 * every write it receives.
 */
function blogApi(initial: Blog[]) {
  let blogs = [...initial];
  const sent: Sent[] = [];
  const record = async (request: Request) => {
    const body: unknown =
      request.method === 'DELETE' ? undefined : await request.json();
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body,
    });
    return body as Partial<Blog>;
  };
  const find = (id: unknown) => blogs.find((b) => b.id === Number(id));
  const notFound = () =>
    HttpResponse.json({ detail: 'No Blog matches.' }, { status: 404 });

  server.use(
    paginatedBlogsHandler(() => blogs),
    http.get(url('/api/blogs/:id/'), ({ params }) => {
      const blog = find(params.id);
      return blog ? HttpResponse.json(blog) : notFound();
    }),
    http.post(url('/api/blogs/'), async ({ request }) => {
      const body = await record(request);
      const blog = makeBlog(500, { ...body, created_at: '2026-12-31' });
      blogs = [blog, ...blogs];
      return HttpResponse.json(blog, { status: 201 });
    }),
    http.patch(url('/api/blogs/:id/'), async ({ request, params }) => {
      const body = await record(request);
      const blog = find(params.id);
      if (!blog) return notFound();
      const updated = { ...blog, ...body };
      blogs = blogs.map((b) => (b.id === blog.id ? updated : b));
      return HttpResponse.json(updated);
    }),
    http.delete(url('/api/blogs/:id/'), async ({ request, params }) => {
      await record(request);
      blogs = blogs.filter((b) => b.id !== Number(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { sent };
}

async function listedTitles() {
  const list = await screen.findByRole('list');
  return within(list)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent);
}

describe('blogSchema', () => {
  it('trims, and allows 200 characters in a title but not 201', () => {
    expect(blogSchema.parse({ title: '  Hi  ', content: ' Body\n' })).toEqual({
      title: 'Hi',
      content: 'Body',
    });
    expect(
      blogSchema.safeParse({ title: 'x'.repeat(200), content: 'c' }).success,
    ).toBe(true);
    expect(
      blogSchema.safeParse({ title: 'x'.repeat(201), content: 'c' }).success,
    ).toBe(false);
  });
});

describe('BlogFormPage: new blog', () => {
  it('shows client errors for empty fields without calling the API', async () => {
    logIn();
    const { sent } = blogApi([]);
    renderRoute('/blogs/new');

    await userEvent.type(await screen.findByLabelText('Title'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Enter a title.')).toBeInTheDocument();
    expect(screen.getByText('Write some content.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(sent).toEqual([]);
  });

  it('rejects a 201-character title without calling the API', async () => {
    logIn();
    const { sent } = blogApi([]);
    renderRoute('/blogs/new');

    const title = await screen.findByLabelText('Title');
    expect(title).toHaveAttribute('maxLength', '200');
    // maxLength stops typing, not a pasted or programmatic value.
    fireEvent.change(title, { target: { value: 'x'.repeat(201) } });
    await userEvent.type(screen.getByLabelText('Content'), 'Body');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(
      await screen.findByText('Keep the title to 200 characters or fewer.'),
    ).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('shows a server field error under its field', async () => {
    logIn();
    server.use(
      http.post(url('/api/blogs/'), () =>
        HttpResponse.json(
          { title: ['Ensure this field has no more than 200 characters.'] },
          { status: 400 },
        ),
      ),
    );
    renderRoute('/blogs/new');

    await userEvent.type(await screen.findByLabelText('Title'), 'Hello');
    await userEvent.type(screen.getByLabelText('Content'), 'Body');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    const error = await screen.findByText(
      'Ensure this field has no more than 200 characters.',
    );
    expect(error).toHaveAttribute('id', 'title-error');
    expect(screen.getByLabelText('Title')).toHaveAttribute(
      'aria-describedby',
      'title-error',
    );
  });

  it('shows a server detail in the form-level alert', async () => {
    logIn();
    server.use(
      http.post(url('/api/blogs/'), () =>
        HttpResponse.json(
          {
            detail:
              'This account has no author profile, so it cannot create blogs.',
          },
          { status: 403 },
        ),
      ),
    );
    renderRoute('/blogs/new');

    await userEvent.type(await screen.findByLabelText('Title'), 'Hello');
    await userEvent.type(screen.getByLabelText('Content'), 'Body');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account has no author profile, so it cannot create blogs.',
    );
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('creates the blog, opens it, and lists it', async () => {
    logIn();
    const { sent } = blogApi([makeBlog(1, { title: 'Older' })]);
    const { router } = renderRoute('/blogs');
    expect(await listedTitles()).toEqual(['Older']);

    await userEvent.click(screen.getByRole('link', { name: 'New blog' }));
    await userEvent.type(await screen.findByLabelText('Title'), '  Fresh  ');
    await userEvent.type(
      screen.getByLabelText('Content'),
      'Line 1{enter}Line 2',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Fresh' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/blogs/500');
    expect(sent).toEqual([
      {
        method: 'POST',
        path: '/api/blogs/',
        body: { title: 'Fresh', content: 'Line 1\nLine 2' },
      },
    ]);

    await userEvent.click(screen.getByRole('link', { name: 'All blogs' }));
    await waitFor(async () =>
      expect(await listedTitles()).toEqual(['Fresh', 'Older']),
    );
  });

  it('disables Publish while the request is pending', async () => {
    logIn();
    let release: () => void = () => {};
    server.use(
      http.post(url('/api/blogs/'), async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ detail: 'Nope.' }, { status: 400 });
      }),
    );
    renderRoute('/blogs/new');

    await userEvent.type(await screen.findByLabelText('Title'), 'Hello');
    await userEvent.type(screen.getByLabelText('Content'), 'Body');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(
      await screen.findByRole('button', { name: 'Publishing…' }),
    ).toBeDisabled();
    release();
    expect(await screen.findByRole('alert')).toHaveTextContent('Nope.');
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('explains that an account without an author cannot write', async () => {
    logIn(null);
    renderRoute('/blogs/new');
    expect(
      await screen.findByText(/has no author profile/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });
});

describe('BlogFormPage: edit blog', () => {
  it('prefills, PATCHes only the changed fields, and shows the change', async () => {
    logIn();
    const { sent } = blogApi([
      makeBlog(5, { title: 'Before', content: 'Same body' }),
    ]);
    const { router } = renderRoute('/blogs');
    expect(await listedTitles()).toEqual(['Before']);

    await userEvent.click(screen.getByRole('link', { name: 'Before' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Edit' }));

    const title = await screen.findByLabelText('Title');
    expect(title).toHaveValue('Before');
    expect(screen.getByLabelText('Content')).toHaveValue('Same body');
    await userEvent.clear(title);
    await userEvent.type(title, 'After');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'After' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/blogs/5');
    expect(sent).toEqual([
      { method: 'PATCH', path: '/api/blogs/5/', body: { title: 'After' } },
    ]);

    await userEvent.click(screen.getByRole('link', { name: 'All blogs' }));
    await waitFor(async () => expect(await listedTitles()).toEqual(['After']));
  });

  it('goes back without a request when nothing changed', async () => {
    logIn();
    const { sent } = blogApi([makeBlog(5)]);
    const { router } = renderRoute('/blogs/5/edit');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Save changes' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/blogs/5'),
    );
    expect(sent).toEqual([]);
  });

  it("lets a staff account edit another author's blog", async () => {
    setToken('t0k3n');
    server.use(
      http.get(url('/api/auth/me/'), () =>
        HttpResponse.json({
          id: 2,
          username: 'admin',
          is_staff: true,
          author_id: null,
        }),
      ),
    );
    blogApi([makeBlog(5, { title: 'Theirs' })]);
    renderRoute('/blogs/5/edit');
    expect(await screen.findByLabelText('Title')).toHaveValue('Theirs');
  });

  it("refuses another author's blog", async () => {
    logIn(99);
    blogApi([makeBlog(5)]);
    renderRoute('/blogs/5/edit');
    expect(
      await screen.findByText(/You can only edit your own blogs/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('shows not-found for an unknown blog', async () => {
    logIn();
    blogApi([]);
    renderRoute('/blogs/42/edit');
    expect(
      await screen.findByRole('heading', { name: 'Blog not found' }),
    ).toBeInTheDocument();
  });

  it('redirects an anonymous visitor to /login', async () => {
    const { router } = renderRoute('/blogs/5/edit');
    expect(
      await screen.findByRole('heading', { name: 'Log in' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('Deleting a blog', () => {
  it('treats a blog that is already gone as deleted', async () => {
    logIn();
    blogApi([makeBlog(5, { title: 'Doomed' })]);
    server.use(
      http.delete(url('/api/blogs/5/'), () =>
        HttpResponse.json({ detail: 'No Blog matches.' }, { status: 404 }),
      ),
    );
    const { router } = renderRoute('/blogs/5');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete "Doomed"?' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/blogs'));
  });

  it('asks first; Cancel does nothing', async () => {
    logIn();
    const { sent } = blogApi([makeBlog(5, { title: 'Doomed' })]);
    const { router } = renderRoute('/blogs/5');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete "Doomed"?' });
    expect(dialog).toHaveTextContent("This can't be undone.");

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Delete "Doomed"?' }),
    ).not.toBeInTheDocument();
    expect(sent).toEqual([]);
    expect(router.state.location.pathname).toBe('/blogs/5');
  });

  it('deletes and returns to a list without the blog', async () => {
    logIn();
    const { sent } = blogApi([
      makeBlog(5, { title: 'Doomed' }),
      makeBlog(6, { title: 'Survivor', created_at: '2025-01-01' }),
    ]);
    const { router } = renderRoute('/blogs');
    expect(await listedTitles()).toEqual(['Doomed', 'Survivor']);

    await userEvent.click(screen.getByRole('link', { name: 'Doomed' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete "Doomed"?' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/blogs'));
    expect(await listedTitles()).toEqual(['Survivor']);
    expect(sent).toEqual([
      { method: 'DELETE', path: '/api/blogs/5/', body: undefined },
    ]);
  });

  it('shows a failure inside the dialog', async () => {
    logIn();
    blogApi([makeBlog(5, { title: 'Doomed' })]);
    server.use(
      http.delete(url('/api/blogs/5/'), () =>
        HttpResponse.json(
          { detail: 'You can only change your own blogs.' },
          { status: 403 },
        ),
      ),
    );
    const { router } = renderRoute('/blogs/5');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete "Doomed"?' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'You can only change your own blogs.',
    );
    expect(router.state.location.pathname).toBe('/blogs/5');
  });
});
