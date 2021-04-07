import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results: posts, next_page } = postsPagination;

  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  const [urlNextPage, setUrlNextPage] = useState('');

  useEffect(() => {
    setLoadedPosts(posts.slice());
    setUrlNextPage(next_page);
  }, [next_page, posts]);

  function handleMorePosts(): void {
    if (!urlNextPage) {
      return;
    }

    fetch(urlNextPage)
      .then(response => response.json())
      .then(data => {
        setUrlNextPage(data.next_page);
        setLoadedPosts(data.results);
      });
  }

  return (
    <>
      <Header />
      <main className={styles.posts}>
        {loadedPosts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <div className={styles.postContent}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postSubInfo}>
                  <p>
                    <FiCalendar className={styles.icon} />
                    <span style={{ textTransform: 'capitalize' }}>
                      {format(
                        new Date(post.first_publication_date),
                        'd MMM yyyy',
                        { locale: ptBR }
                      )}
                    </span>
                    <FiUser className={styles.icon} />
                    {post.data.author}
                  </p>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </main>
      {urlNextPage && (
        <button
          type="button"
          className={styles.morePosts}
          onClick={handleMorePosts}
        >
          Carregar mais posts
        </button>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const { results, next_page } = await prismic.query(
    [Prismic.Predicates.at('document.type', 'ignite-blog')],
    {
      fetch: ['posts.title', 'posts.content'],
      pageSize: 1,
      page: 1,
    }
  );

  const posts = results.map(post => {
    return {
      uid: post.uid,

      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
      revalidate: 60 * 60 * 24,
    },
  };
};
