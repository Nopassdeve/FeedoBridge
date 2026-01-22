import { useRouter } from 'next/router';
import SettingsPage from '@/components/SettingsPage';

export default function Home() {
  const router = useRouter();
  const { shop } = router.query;

  if (!shop) {
    return <div>Loading...</div>;
  }

  return <SettingsPage shopId={shop as string} />;
}
