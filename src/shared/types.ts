export interface Tag {
  slug: string;
  name: string;
  count: number;
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  cover: string | null;
  featured: boolean;
  publishedAt: string | null;
  readingTime: number;
  tags: Tag[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostDetail extends PostSummary {
  html: string;
  seoTitle: string | null;
  seoDesc: string | null;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  related: PostSummary[];
}

export interface Work {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  descriptionHtml: string | null;
  link: string | null;
  linkLabel: string | null;
  year: string | null;
  stack: string[];
  sort: number;
}

export interface GalleryItem {
  id: number;
  src: string;
  caption: string | null;
  location: string | null;
  takenAt: string | null;
}

export interface NowItem {
  id: number;
  label: string;
  value: string;
  note: string | null;
}

export interface ToolItem {
  id: number;
  name: string;
  category: string | null;
  note: string | null;
  url: string | null;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteData {
  meta: {
    name: string;
    role: string;
    status: string;
    intro: string;
    bio: string;
    avatar: string;
    since: string;
    location: string;
    email: string;
    socials: SocialLink[];
    footerNote: string;
    newsletterNote: string;
  };
  stats: {
    posts: number;
    works: number;
    tags: number;
    words: number;
  };
  now: NowItem[];
  tools: ToolItem[];
  tags: Tag[];
}

export interface ArchiveYear {
  year: string;
  posts: PostSummary[];
}

export interface PostListResponse {
  posts: PostSummary[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface AdminStats {
  posts: number;
  drafts: number;
  works: number;
  gallery: number;
  subscribers: number;
  words: number;
}
