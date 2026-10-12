import { NotFoundPage } from '../../components/NotFoundPage.tsx';

export function UserNotFound() {
  return (
    <NotFoundPage
      title="Author not found"
      message="This author doesn't exist, or they were removed."
    />
  );
}
