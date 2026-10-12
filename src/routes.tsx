import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { LoginPage } from './auth/LoginPage.tsx';
import { RequireAuth } from './auth/RequireAuth.tsx';
import { Layout } from './components/Layout.tsx';
import { NotFoundPage } from './components/NotFoundPage.tsx';
import { RouteErrorPage } from './components/RouteErrorPage.tsx';
import { BlogFormPage } from './features/blogs/BlogFormPage.tsx';
import { BlogDetailPage } from './features/blogs/BlogDetailPage.tsx';
import { BlogListPage } from './features/blogs/BlogListPage.tsx';
import { UserDetailPage } from './features/users/UserDetailPage.tsx';
import { UserListPage } from './features/users/UserListPage.tsx';

export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    errorElement: <RouteErrorPage standalone />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to="/blogs" replace /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'blogs', element: <BlogListPage /> },
          {
            element: <RequireAuth />,
            children: [
              { path: 'blogs/new', element: <BlogFormPage /> },
              { path: 'blogs/:id/edit', element: <BlogFormPage /> },
            ],
          },
          { path: 'blogs/:id', element: <BlogDetailPage /> },
          { path: 'users', element: <UserListPage /> },
          { path: 'users/:id', element: <UserDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
