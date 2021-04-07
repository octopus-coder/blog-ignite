import { AppProps } from 'next/app';
import styles from '../styles/common.module.scss';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.main}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;
