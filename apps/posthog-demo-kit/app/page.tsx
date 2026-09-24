import Link from 'next/link';
import { getAllPosts } from '@/lib/contentful';

export default async function HomePage() {
  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
  let error: string | null = null;

  try {
    posts = await getAllPosts();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch posts';
  }

  return (
    <>
      <nav className="nav">
        <div className="container nav-content">
          <span className="nav-logo">Demo Blog</span>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">
              PostHog
            </a>
          </div>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <h1>Demo Blog</h1>
          <p>A simple blog powered by Contentful with PostHog analytics tracking.</p>
        </section>

        {error ? (
          <div className="empty-state">
            <h2>Connection Error</h2>
            <p>{error}</p>
            <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>
              Make sure your environment variables are configured correctly.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h2>No Posts Yet</h2>
            <p>Run the seeder script to create demo content:</p>
            <code style={{ display: 'block', marginTop: '16px', color: '#f97316' }}>
              npm run seed:all
            </code>
          </div>
        ) : (
          <section className="posts-grid">
            {posts.map((post) => (
              <Link key={post.sys.id} href={`/blog/${post.slug}`} className="post-card">
                <h2>{post.title}</h2>
                <span className="slug">/blog/{post.slug}</span>
              </Link>
            ))}
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>PostHog Demo Kit • Analytics tracked with ❤️</p>
        </div>
      </footer>
    </>
  );
}
