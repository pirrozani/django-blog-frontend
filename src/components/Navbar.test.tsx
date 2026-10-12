import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { setToken } from '../auth/tokenStorage.ts';
import { API_URL } from '../config.ts';
import { server } from '../mocks/server.ts';
import { renderRoute } from '../test/renderRoute.tsx';

const menuQuery = { name: 'Main menu' } as const;

async function openMenu() {
  const button = await screen.findByRole('button', { name: 'Menu' });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button).not.toHaveAttribute('aria-controls');
  expect(screen.queryByRole('navigation', menuQuery)).not.toBeInTheDocument();
  await userEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');
  const menu = screen.getByRole('navigation', menuQuery);
  expect(button).toHaveAttribute('aria-controls', menu.id);
  return { button, menu };
}

describe('mobile menu', () => {
  it('lists Blogs, Authors and Log in, and closes on navigation', async () => {
    const { router } = renderRoute('/blogs');
    const { button, menu } = await openMenu();

    const items = within(menu);
    expect(items.getByRole('link', { name: 'Blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
    expect(items.getByRole('link', { name: 'Authors' })).toHaveAttribute(
      'href',
      '/users',
    );
    expect(await items.findByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );

    await userEvent.click(items.getByRole('link', { name: 'Authors' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    expect(screen.queryByRole('navigation', menuQuery)).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the account and Log out when signed in', async () => {
    setToken('t0k3n');
    server.use(
      http.get(`${API_URL}/api/auth/me/`, () =>
        HttpResponse.json({
          id: 1,
          username: 'demo',
          is_staff: false,
          author_id: 7,
        }),
      ),
    );
    renderRoute('/blogs');
    // Wait for the session, so the desktop nav shows the account too.
    await screen.findByText('demo');
    const { menu } = await openMenu();

    const items = within(menu);
    expect(items.getByText(/Signed in as/)).toHaveTextContent(
      'Signed in as demo',
    );
    expect(items.getByRole('link', { name: 'demo' })).toHaveAttribute(
      'href',
      '/users/7',
    );
    expect(items.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(
      items.queryByRole('link', { name: 'Log in' }),
    ).not.toBeInTheDocument();
  });

  it('closes on Escape from inside and gives focus back to the button', async () => {
    renderRoute('/blogs');
    const { button, menu } = await openMenu();
    await within(menu).findByRole('link', { name: 'Log in' });

    await userEvent.tab();
    expect(within(menu).getByRole('link', { name: 'Blogs' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', menuQuery)).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('closes when focus tabs past its last item', async () => {
    renderRoute('/blogs');
    const { menu } = await openMenu();
    const logIn = await within(menu).findByRole('link', { name: 'Log in' });

    await userEvent.tab(); // Blogs
    await userEvent.tab(); // Authors
    await userEvent.tab(); // Log in
    expect(logIn).toHaveFocus();

    await userEvent.tab();
    expect(screen.queryByRole('navigation', menuQuery)).not.toBeInTheDocument();
  });

  it('closes on a click outside it', async () => {
    renderRoute('/blogs');
    await openMenu();

    await userEvent.click(
      await screen.findByRole('heading', { level: 1, name: 'Blogs' }),
    );
    expect(screen.queryByRole('navigation', menuQuery)).not.toBeInTheDocument();
  });
});
