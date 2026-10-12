import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from './test/renderRoute.tsx';

describe('routes', () => {
  it('redirects / to /blogs', async () => {
    const { router } = renderRoute('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Blogs' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/blogs');
  });

  it('shows the 404 page for an unknown path', async () => {
    renderRoute('/nope/nothing-here');
    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
  });

  it('labels the /users routes "Authors" in the navbar', async () => {
    renderRoute('/users');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
    const authors = within(nav).getByRole('link', { name: 'Authors' });
    expect(authors).toHaveAttribute('href', '/users');
    expect(authors).toHaveAttribute('aria-current', 'page');
  });
});
