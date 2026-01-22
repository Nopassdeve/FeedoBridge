import type { AppProps } from 'next/app';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider i18n={{}}>
      <Component {...pageProps} />
    </AppProvider>
  );
}
