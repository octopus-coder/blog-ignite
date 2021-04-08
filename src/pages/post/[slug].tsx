import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface otherPost {
  slug: string;
  title: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  prevPost: otherPost;
  nextPost: otherPost;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    const sum = contentItem.body
      .map(item => item.text.split(' ').length)
      .reduce((suma, current) => {
        return suma + current;
      }, 0);
    return sum + total + contentItem.heading.split(' ').length;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main>
        <article>
          <h1 className={styles.title}>{post.data.title}</h1>
          <p className={styles.postInfo}>
            <FiCalendar />
            <time>
              {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{`${readingTime} min`}</span>
            <i>
              {`* editado em ${format(
                new Date(post.last_publication_date),
                'd MMM yyyy',
                { locale: ptBR }
              )}, às ${format(new Date(post.last_publication_date), 'hh:mm', {
                locale: ptBR,
              })} `}
            </i>
          </p>
          {post.data.content.map(content => (
            <article key={content.heading} className={styles.postContent}>
              <h2>{content.heading}</h2>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </article>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerPosts}>
          <div className={styles.otherPost}>
            {post.prevPost.slug && (
              <Link href={`/post/${post.prevPost.slug}`}>
                <a>
                  <h3>{post.prevPost.title}</h3>
                  <p>Post anterior</p>
                </a>
              </Link>
            )}
          </div>
          <div className={styles.otherPost}>
            {post.nextPost.slug && (
              <Link href={`/post/${post.nextPost.slug}`}>
                <a>
                  <h3>{post.nextPost.title}</h3>
                  <p>Próximo post</p>
                </a>
              </Link>
            )}
          </div>
        </div>
        {/* <div>Comentarios</div> */}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'ignite-blog'),
  ]);

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('ignite-blog', String(slug), {});

  const { results } = await prismic.query([
    Prismic.Predicates.at('document.type', 'ignite-blog'),
  ]);

  const prevAndNextPost = results
    .map((post, index) => {
      if (post.uid !== slug) return null;
      return {
        prevPost: {
          slug: index - 1 >= 0 ? results[index - 1].uid : null,
          title: index - 1 >= 0 ? results[index - 1].data.title : null,
        },
        nextPost: {
          slug: index + 1 < results.length ? results[index + 1].uid : null,
          title:
            index + 1 < results.length ? results[index + 1].data.title : null,
        },
      };
    })
    .filter(post => post !== null)[0];

  const post = {
    ...prevAndNextPost,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,

    ...response,

    data: {
      ...response.data,
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: { post },
  };
};
