'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePostHogEvents } from '@/app/providers';

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

interface PostData {
  title: string;
  slug: string;
  body?: string;
}

export default function BlogPostPage({ params }: BlogPostProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctaClicked, setCtaClicked] = useState(false);
  const { trackEvent } = usePostHogEvents();

  useEffect(() => {
    async function loadPost() {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/posts/${resolvedParams.slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else {
            setError('Failed to load post');
          }
          return;
        }

        const data = await response.json();
        setPost(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [params]);

  // Handle CTA button click - tracks custom event for Feature Flags demo
  const handleCtaClick = () => {
    trackEvent('clicked_cta_button', {
      page: `/blog/${post?.slug}`,
      button_text: 'Sign Up Now',
      post_title: post?.title || 'Unknown',
    });
    setCtaClicked(true);
  };

  if (isLoading) {
    return (
      <>
        <nav className="nav">
          <div className="container nav-content">
            <span className="nav-logo">Demo Blog</span>
          </div>
        </nav>
        <main className="container">
          <div className="loading">
            <div className="loading-spinner" />
            <p>Loading post...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <nav className="nav">
          <div className="container nav-content">
            <span className="nav-logo">Demo Blog</span>
          </div>
        </nav>
        <main className="container">
          <div className="empty-state">
            <h2>{error || 'Post Not Found'}</h2>
            <p>
              <Link href="/">← Back to home</Link>
            </p>
          </div>
        </main>
      </>
    );
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
        <header className="post-header">
          <Link href="/" className="back-link">
            ← Back to all posts
          </Link>
          <h1>{post.title}</h1>
          <p className="meta">Published on Demo Blog • URL: /blog/{post.slug}</p>
        </header>

        <article className="post-content">
          <p>
            This is a demo blog post rendered from Contentful. The PostHog analytics app in
            Contentful will show traffic data for this exact URL pattern.
          </p>

          <p>
            Every time someone visits this page, PostHog captures a <code>$pageview</code> event
            with the current URL. The Contentful app uses this data to show pageviews, unique users,
            and session recordings.
          </p>

          <p>
            You can also track custom events. Try clicking the button below to see how custom event
            tracking works with Feature Flags.
          </p>

          {/* CTA Section for custom event demo */}
          <div className="cta-section">
            <h3>Want to see more?</h3>
            <p>Click the button below to trigger a tracked custom event.</p>
            <button
              className="cta-button"
              onClick={handleCtaClick}
              disabled={ctaClicked}
              style={ctaClicked ? { opacity: 0.6, cursor: 'default' } : {}}>
              {ctaClicked ? (
                <>✓ Event Tracked!</>
              ) : (
                <>
                  Sign Up Now
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
            {ctaClicked && (
              <p style={{ marginTop: '16px', fontSize: '0.875rem', color: '#22c55e' }}>
                Check PostHog to see the <code>clicked_cta_button</code> event!
              </p>
            )}
          </div>
        </article>
      </main>

      <footer className="footer">
        <div className="container">
          <p>PostHog Demo Kit • Analytics tracked with ❤️</p>
        </div>
      </footer>
    </>
  );
}
