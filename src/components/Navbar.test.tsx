import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute.tsx';

async function openMenu() {
  const button = await screen.findByRole('button', { name: 'Menu' });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
  await userEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');
  return button;
}

/** The pop-up menu, the nav that follows the Menu button. */
function popUp() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) throw new Error('the menu is closed');
  return menu;
}

describe('mobile menu', () => {
  it('lists Blogs, Authors and Log in, and closes on navigation', async () => {
    const { router } = renderRoute('/blogs');
    await openMenu();

    const menu = within(popUp());
    expect(menu.getByRole('link', { name: 'Blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
    expect(menu.getByRole('link', { name: 'Authors' })).toHaveAttribute(
      'href',
      '/users',
    );
    expect(await menu.findByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );

    await userEvent.click(menu.getByRole('link', { name: 'Authors' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes on Escape and gives focus back to the button', async () => {
    renderRoute('/blogs');
    const button = await openMenu();

    await userEvent.keyboard('{Escape}');
    expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('closes on a click outside it', async () => {
    renderRoute('/blogs');
    await openMenu();

    await userEvent.click(
      await screen.findByRole('heading', { level: 1, name: 'Blogs' }),
    );
    expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
  });
});
