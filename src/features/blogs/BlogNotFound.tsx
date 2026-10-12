import { NotFoundPage } from '../../components/NotFoundPage.tsx';

export function BlogNotFound() {
  return (
    <NotFoundPage
      title="Blog not found"
      message="This blog doesn't exist, or it was deleted."
    />
  );
}
