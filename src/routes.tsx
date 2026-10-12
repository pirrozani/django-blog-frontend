import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { ComingSoon } from './components/ComingSoon.tsx';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { RouteErrorPage } from './components/RouteErrorPage.tsx';

// Feature pages replace the ComingSoon placeholders in #4–#7.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteErrorPage standalone />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to="/blogs" replace /> },
          { path: 'login', element: <ComingSoon title="Log in" /> },
          { path: 'blogs', element: <ComingSoon title="Blogs" /> },
          { path: 'blogs/new', element: <ComingSoon title="New blog" /> },
          { path: 'blogs/:id', element: <ComingSoon title="Blog" /> },
          { path: 'blogs/:id/edit', element: <ComingSoon title="Edit blog" /> },
          { path: 'users', element: <ComingSoon title="Authors" /> },
          { path: 'users/:id', element: <ComingSoon title="Author" /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
