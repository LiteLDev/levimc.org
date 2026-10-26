// Blog data shared by the build (blog/content.ts) and the app (src/blog/).

export interface BlogTerm {
  name: string;
  /** Hexo slug (hexo-util slugize), e.g. "Bedrock-Dedicated-Server". */
  slug: string;
  url: string;
  count: number;
}

export interface BlogAuthor {
  name: string;
  /** GitHub login (from content/blog/authors.yml). */
  github?: string;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** ISO date with the Asia/Shanghai offset, e.g. 2023-07-26T18:28:00+08:00. */
  date: string;
  url: string;
  /** Path of the post on the old blog (blog.levimc.org) — the Waline comment key. */
  oldPath: string;
  author: BlogAuthor | null;
  tags: BlogTerm[];
  category: BlogTerm | null;
  excerpt: string;
  readingMinutes: number;
  /** Language of the post content (BCP-47). */
  lang: string;
}

export interface BlogPage {
  name: string;
  title: string;
  date?: string;
  url: string;
  oldPath: string;
}

export interface BlogArchiveYear {
  year: string;
  count: number;
  months: { month: string; count: number }[];
}

export interface BlogData {
  /** Newest first. */
  posts: BlogPost[];
  tags: BlogTerm[];
  categories: BlogTerm[];
  archives: BlogArchiveYear[];
  pages: Record<string, BlogPage>;
  perPage: number;
  /** Language the posts and pages are written in (BCP-47). */
  lang: string;
}

export interface BlogDoc {
  html: string;
  toc: { level: number; id: string; text: string }[];
  lang: string;
}
