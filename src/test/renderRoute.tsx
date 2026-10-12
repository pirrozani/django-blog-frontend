import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createQueryClient } from '../queryClient.ts';
import { routes } from '../routes.tsx';

/** Renders the whole app (real routes, fresh query cache) at `path`. */
export function renderRoute(path: string) {
  const queryClient = createQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
