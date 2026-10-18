// levimc.org/blog/ — the LeviMC blog (moved from blog.levimc.org): index, posts, tags, categories, archives and
// the blog's own pages, in the kit's language (painted hero, pixel cards, hotbar, prose canvas).
import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Badge, PaintedHero, Pagination, PixelIcon, uiStrings, type PixelIconName } from '../../kit/components';
import { useI18n, kitLocale, type Messages } from '../i18n';
import NotFound from '../pages/NotFound';
import { isLatin } from '../components/ui';
import { blog, pageOf, pagedHref, resolveBlogPath, useBlogDoc, type BlogPost, type BlogTerm, type BlogView } from './data';
import Comments from './Comments';
import { useProseEnhancements } from './enhance';
import 'virtual:levimc-blog/tokens.css';

type B = Messages['blog'];

/** The blog's sections, as a hotbar under the hero / page title. */
function BlogNav({ view }: { view: BlogView }) {
  const { t } = useI18n();
  const b = t.blog;
  const items: { key: BlogView['kind'] | 'rss' | 'about' | 'friends'; href: string; label: string; icon: PixelIconName; active: boolean }[] = [
    { key: 'index', href: '/blog/', label: b.posts, icon: 'paper', active: view.kind === 'index' || view.kind === 'post' },
    { key: 'tags', href: '/blog/tags/', label: b.tags, icon: 'hash', active: view.kind === 'tags' || view.kind === 'tag' },
    { key: 'categories', href: '/blog/categories/', label: b.categories, icon: 'chest', active: view.kind === 'categories' || view.kind === 'category' },
    { key: 'archives', href: '/blog/archives/', label: b.archives, icon: 'clock', active: view.kind === 'archives' },
    ...(blog.pages.about ? [{ key: 'about' as const, href: blog.pages.about.url, label: b.about, icon: 'quote' as const, active: view.kind === 'page' && view.name === 'about' }] : []),
    ...(blog.pages.friends ? [{ key: 'friends' as const, href: blog.pages.friends.url, label: b.friends, icon: 'heart' as const, active: view.kind === 'page' && view.name === 'friends' }] : []),
  ];
  // phones: the row scrolls sideways; keep the current section in view
  const ref = useRef<HTMLElement>(null);
  const active = items.find((i) => i.active)?.key;
  useEffect(() => {
    const nav = ref.current;
    const cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
  }, [active]);
  return (
    <nav ref={ref} className="lm-blog-nav" aria-label={b.sections}>
      <div className="hotbar">
        {items.map((i) => (
          <Link key={i.key} to={i.href} aria-current={i.active ? 'page' : undefined}>
            <PixelIcon name={i.icon} />
            <span>{i.label}</span>
          </Link>
        ))}
        <a href="/blog/rss.xml" type="application/rss+xml">
          <PixelIcon name="torch" />
          <span>{b.rss}</span>
        </a>
      </div>
    </nav>
  );
}

export function PostDate({ iso, b }: { iso: string; b: B }) {
  return <time dateTime={iso}>{b.date(iso)}</time>;
}

function Author({ post, size = 24 }: { post: BlogPost; size?: number }) {
  const a = post.author;
  if (!a) return null;
  const face = a.avatar ? (
    <img className="lm-blog-avatar" src={`${a.avatar}&s=${size * 2}`} alt="" width={size} height={size} loading="lazy" decoding="async" />
  ) : (
    <span className="lm-blog-avatar lm-blog-avatar-blank" aria-hidden="true">
      <PixelIcon name="grass" />
    </span>
  );
  return a.github ? (
    <a className="lm-blog-author" href={`https://github.com/${a.github}`} target="_blank" rel="noopener">
      {face}
      <span>{a.name}</span>
    </a>
  ) : (
    <span className="lm-blog-author">
      {face}
      <span>{a.name}</span>
    </span>
  );
}

function PostMeta({ post, b }: { post: BlogPost; b: B }) {
  return (
    <p className="lm-blog-meta">
      <Author post={post} />
      <span className="lm-blog-meta-item">
        <PixelIcon name="clock" />
        <PostDate iso={post.date} b={b} />
      </span>
      <span className="lm-blog-meta-item">
        <PixelIcon name="bookQuill" />
        {b.minutes(post.readingMinutes)}
      </span>
    </p>
  );
}

function TermChips({ post, withCategory = false }: { post: BlogPost; withCategory?: boolean }) {
  return (
    <ul className="lm-blog-chips">
      {withCategory && post.category ? (
        <li>
          <Link to={post.category.url} className="lm-blog-chip is-category">
            <PixelIcon name="chest" />
            {post.category.name}
          </Link>
        </li>
      ) : null}
      {post.tags.map((t) => (
        <li key={t.slug}>
          <Link to={t.url} className="lm-blog-chip">
            <PixelIcon name="hash" />
            {t.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PostCard({ post, b, headingLevel = 2 }: { post: BlogPost; b: B; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2';
  return (
    <article className="px-card lm-blog-card">
      {post.category ? (
        <Link to={post.category.url} className="lm-blog-card-cat">
          {post.category.name}
        </Link>
      ) : null}
      <H className="lm-blog-card-title" lang={post.lang}>
        <Link to={post.url}>{post.title}</Link>
      </H>
      <PostMeta post={post} b={b} />
      <p className="lm-blog-excerpt" lang={post.lang}>
        {post.excerpt}
      </p>
      <div className="lm-blog-card-foot">
        <TermChips post={post} />
        <Link to={post.url} className="lm-blog-more" aria-hidden="true" tabIndex={-1}>
          {b.readMore}
          <PixelIcon name="arrowRight" />
        </Link>
      </div>
    </article>
  );
}

function SideCard({ title, icon, children }: { title: string; icon: PixelIconName; children: ReactNode }) {
  return (
    <section className="px-card lm-blog-side-card">
      <h2 className="lm-blog-side-title">
        <PixelIcon name={icon} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function TermList({ terms, kind }: { terms: BlogTerm[]; kind: 'tags' | 'categories' }) {
  return (
    <ul className={kind === 'tags' ? 'lm-blog-chips' : 'lm-blog-terms'}>
      {terms.map((t) => (
        <li key={t.slug}>
          <Link to={t.url} className={kind === 'tags' ? 'lm-blog-chip' : 'lm-blog-term'}>
            {kind === 'tags' ? <PixelIcon name="hash" /> : null}
            <span>{t.name}</span>
            <span className="lm-blog-count">{t.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Sidebar({ b }: { b: B }) {
  return (
    <aside className="lm-blog-side" aria-label={b.sections}>
      <SideCard title={b.categories} icon="chest">
        <TermList terms={blog.categories} kind="categories" />
      </SideCard>
      <SideCard title={b.tags} icon="hash">
        <TermList terms={blog.tags} kind="tags" />
      </SideCard>
      <SideCard title={b.archives} icon="clock">
        <ul className="lm-blog-terms">
          {blog.archives.map((y) =>
            y.months.map((m) => (
              <li key={y.year + m.month}>
                <Link to={`/blog/archives/${y.year}/${m.month}/`} className="lm-blog-term">
                  <span>{b.monthLabel(y.year, m.month)}</span>
                  <span className="lm-blog-count">{m.count}</span>
                </Link>
              </li>
            )),
          )}
        </ul>
      </SideCard>
    </aside>
  );
}

/** Hotbar pagination (crawlable links, navigation inside the app). */
function BlogPagination({ page, pageCount, base }: { page: number; pageCount: number; base: string }) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const ui = uiStrings(kitLocale[locale]);
  const hrefFor = (p: number) => pagedHref(base, p);
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      hrefFor={hrefFor}
      previousLabel={ui.previous}
      nextLabel={ui.next}
      onNavigate={(p, e) => {
        if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(hrefFor(p));
      }}
    />
  );
}

function Index({ page }: { page: number }) {
  const { t } = useI18n();
  const b = t.blog;
  const { items, pageCount } = pageOf(blog.posts, page);
  return (
    <>
      {/* the hero's eyebrow is a Silkscreen micro-label: Latin only */}
      <PaintedHero className="lm-blog-hero" eyebrow="Blog" name={b.name} tagline={b.tagline} horizon />
      <div className="lm-container lm-blog-body">
        <BlogNav view={{ kind: 'index', page }} />
        <div className="lm-blog-layout">
          <section className="lm-blog-main" aria-labelledby="lm-blog-latest">
            <h2 id="lm-blog-latest" className="lm-blog-section-title">
              {page > 1 ? `${b.latest} · ${b.page(page)}` : b.latest}
              <span className="lm-blog-count">{blog.posts.length}</span>
            </h2>
            <div className="lm-blog-list">
              {items.map((p) => (
                <PostCard key={p.slug} post={p} b={b} headingLevel={3} />
              ))}
            </div>
            <BlogPagination page={page} pageCount={pageCount} base="/blog/" />
          </section>
          <Sidebar b={b} />
        </div>
      </div>
    </>
  );
}

/** Year → month → posts, like Hexo's archive pages. */
function Timeline({ posts, b }: { posts: BlogPost[]; b: B }) {
  const years: { year: string; months: { month: string; posts: BlogPost[] }[] }[] = [];
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    const m = p.date.slice(5, 7);
    let yr = years.find((x) => x.year === y);
    if (!yr) years.push((yr = { year: y, months: [] }));
    let mo = yr.months.find((x) => x.month === m);
    if (!mo) yr.months.push((mo = { month: m, posts: [] }));
    mo.posts.push(p);
  }
  return (
    <div className="lm-blog-timeline">
      {years.map((y) => (
        <section key={y.year} className="lm-blog-year" aria-labelledby={`lm-y-${y.year}`}>
          <h2 id={`lm-y-${y.year}`} className="lm-blog-year-title">
            <Link to={`/blog/archives/${y.year}/`}>{y.year}</Link>
          </h2>
          {y.months.map((m) => (
            <div key={m.month} className="lm-blog-month">
              <h3 className="lm-blog-month-title">
                <Link to={`/blog/archives/${y.year}/${m.month}/`}>{b.monthName(m.month)}</Link>
              </h3>
              <ul className="lm-blog-rows">
                {m.posts.map((p) => (
                  <li key={p.slug} className="lm-blog-row">
                    <time className="lm-blog-row-date" dateTime={p.date}>
                      {p.date.slice(5, 10)}
                    </time>
                    <Link to={p.url} className="lm-blog-row-title" lang={p.lang}>
                      {p.title}
                    </Link>
                    {p.author ? <span className="lm-blog-row-author">{p.author.name}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function ListPage({ view, eyebrow, title, posts, base, page }: { view: BlogView; eyebrow: string; title: string; posts: BlogPost[]; base: string; page: number }) {
  const { t } = useI18n();
  const b = t.blog;
  const { items, pageCount } = pageOf(posts, page);
  return (
    <div className="lm-page lm-container lm-blog-body">
      <BlogHead eyebrow={eyebrow} title={title} lead={b.postCount(posts.length)} />
      <BlogNav view={view} />
      <Timeline posts={items} b={b} />
      <BlogPagination page={page} pageCount={pageCount} base={base} />
    </div>
  );
}

function BlogHead({ eyebrow, title, lead, lang }: { eyebrow: string; title: ReactNode; lead?: ReactNode; lang?: string }) {
  return (
    <header className="lm-page-head lm-blog-head">
      <p className={isLatin(eyebrow) ? 'lm-eyebrow kit-pixel-label' : 'lm-eyebrow lm-eyebrow-cjk'}>
        <span className="px-dot" aria-hidden="true" />
        <Link to="/blog/">{eyebrow}</Link>
      </p>
      <h1 className="lm-title" lang={lang}>
        {title}
      </h1>
      {lead ? <p className="lm-lead">{lead}</p> : null}
    </header>
  );
}

function TermsPage({ kind }: { kind: 'tags' | 'categories' }) {
  const { t } = useI18n();
  const b = t.blog;
  const terms = kind === 'tags' ? blog.tags : blog.categories;
  return (
    <div className="lm-page lm-container lm-blog-body">
      <BlogHead eyebrow={b.eyebrow} title={kind === 'tags' ? b.tags : b.categories} lead={b.postCount(blog.posts.length)} />
      <BlogNav view={{ kind }} />
      <div className="px-card lm-blog-terms-card">
        <TermList terms={terms} kind={kind} />
      </div>
    </div>
  );
}

/** "On this page" beside the post on wide screens. */
function Toc({ toc, label }: { toc: { level: number; id: string; text: string }[]; label: string }) {
  if (toc.length < 2) return null;
  return (
    <nav className="lm-blog-toc" aria-label={label}>
      <p className="kit-toc-title">{label}</p>
      <ul className="kit-toc-list">
        {toc.map((e) => (
          <li key={e.id} data-level={e.level - 1}>
            <a href={`#${e.id}`}>{e.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Prose({ id, lang }: { id: string; lang: string }) {
  const { t } = useI18n();
  const doc = useBlogDoc(id);
  const ref = useRef<HTMLDivElement>(null);
  useProseEnhancements(ref, doc ? id : '');
  if (doc === null)
    return (
      <p className="lm-blog-loading">
        <a href={typeof location !== 'undefined' ? location.href : '#'}>
          {t.blog.reload}
        </a>
      </p>
    );
  if (!doc) return <div className="lm-blog-loading" aria-busy="true" />;
  return <div ref={ref} className="kit-prose lm-blog-prose" lang={lang} data-doc-content="" dangerouslySetInnerHTML={{ __html: doc.html }} />;
}

function PostView({ post }: { post: BlogPost }) {
  const { t, locale } = useI18n();
  const b = t.blog;
  const ui = uiStrings(kitLocale[locale]);
  const doc = useBlogDoc(post.slug);
  const i = blog.posts.findIndex((p) => p.slug === post.slug);
  const newer = blog.posts[i - 1];
  const older = blog.posts[i + 1];
  return (
    <div className="lm-page lm-container lm-blog-body">
      <div className="lm-blog-post-grid">
        <article className="lm-blog-post" aria-labelledby="lm-blog-post-title">
          <header className="lm-blog-post-head">
            <nav className="lm-blog-crumbs" aria-label={b.sections}>
              <Link to="/blog/">{b.eyebrow}</Link>
              {post.category ? (
                <>
                  <PixelIcon name="chevronRight" />
                  <Link to={post.category.url}>{post.category.name}</Link>
                </>
              ) : null}
            </nav>
            <h1 id="lm-blog-post-title" className="lm-title lm-blog-post-title" lang={post.lang}>
              {post.title}
            </h1>
            <PostMeta post={post} b={b} />
            <div className="lm-blog-post-tags">
              <TermChips post={post} />
              {locale !== 'zh' ? (
                <Badge tone="pond" className="lm-blog-lang">
                  <span lang="zh-CN">{b.writtenIn}</span>
                </Badge>
              ) : null}
            </div>
          </header>
          <div className="grass-divider grass-divider-thin lm-blog-rule" aria-hidden="true" />
          <Prose id={post.slug} lang={post.lang} />
          <nav className="kit-pager lm-blog-pager" aria-label={`${b.previousPost} / ${b.nextPost}`}>
            {older ? (
              <Link to={older.url} className="px-card kit-pager-link" rel="prev">
                <span className="kit-pager-label">
                  <PixelIcon name="arrowLeft" />
                  {b.previousPost}
                </span>
                <span className="kit-pager-title" lang={older.lang}>
                  {older.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link to={newer.url} className="px-card kit-pager-link is-next" rel="next">
                <span className="kit-pager-label">
                  {b.nextPost}
                  <PixelIcon name="arrowRight" />
                </span>
                <span className="kit-pager-title" lang={newer.lang}>
                  {newer.title}
                </span>
              </Link>
            ) : null}
          </nav>
          <Comments path={post.oldPath} />
        </article>
        <div className="lm-blog-post-side">{doc ? <Toc toc={doc.toc} label={ui.onThisPage} /> : null}</div>
      </div>
    </div>
  );
}

function PageView({ name }: { name: string }) {
  const { t } = useI18n();
  const b = t.blog;
  const page = blog.pages[name]!;
  return (
    <div className="lm-page lm-container lm-blog-body">
      <BlogHead eyebrow={b.eyebrow} title={page.title} lang="zh-CN" />
      <BlogNav view={{ kind: 'page', name }} />
      <div className="lm-blog-page">
        <div className="px-card lm-blog-page-card">
          <Prose id={`page:${name}`} lang="zh-CN" />
        </div>
        <Comments path={page.oldPath} />
      </div>
    </div>
  );
}

/** Every /blog/… URL. Unknown ones are the site's 404 (like GitHub Pages: only prerendered pages exist). */
export default function Blog() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const b = t.blog;
  const view = resolveBlogPath(pathname);
  if (!view) return <NotFound />;
  switch (view.kind) {
    case 'index':
      return <Index page={view.page} />;
    case 'post':
      return <PostView post={view.post} />;
    case 'page':
      return <PageView name={view.name} />;
    case 'tags':
    case 'categories':
      return <TermsPage kind={view.kind} />;
    case 'tag':
      return <ListPage view={view} eyebrow={b.tags} title={view.term.name} posts={blog.posts.filter((p) => p.tags.some((x) => x.slug === view.term.slug))} base={view.term.url} page={view.page} />;
    case 'category':
      return <ListPage view={view} eyebrow={b.categories} title={view.term.name} posts={blog.posts.filter((p) => p.category?.slug === view.term.slug)} base={view.term.url} page={view.page} />;
    case 'archives': {
      const prefix = view.year ? `${view.year}-${view.month ?? ''}` : '';
      const posts = blog.posts.filter((p) => p.date.startsWith(prefix));
      const base = `/blog/archives/${view.year ? `${view.year}/` : ''}${view.month ? `${view.month}/` : ''}`;
      return <ListPage view={view} eyebrow={b.archives} title={view.year ? (view.month ? b.monthLabel(view.year, view.month) : view.year) : b.archives} posts={posts} base={base} page={view.page} />;
    }
  }
}
