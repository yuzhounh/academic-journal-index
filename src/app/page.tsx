import CategoryPage from '@/components/search/CategoryPage';
import { journals } from '@/data/journals';

export default function Home() {
  return <CategoryPage journals={journals} />;
}
