/* 后台专用类型（与 backend/Content.php 的输出一一对应） */

export interface AdminPostRow {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  status: 'draft' | 'published';
  featured: boolean;
  publishedAt: string | null;
  views: number;
  updatedAt: string;
  tags: string[];
}

export interface AdminPostList {
  posts: AdminPostRow[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface AdminPost {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  contentMd: string;
  cover: string | null;
  status: 'draft' | 'published';
  featured: boolean;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  views: number;
  tags: string[];
}

export interface AdminWork {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  descriptionMd: string | null;
  link: string | null;
  linkLabel: string | null;
  year: string | null;
  stack: string[];
  sort: number;
  status: 'published' | 'hidden';
}

export interface AdminGalleryItem {
  id: number;
  src: string;
  caption: string | null;
  location: string | null;
  takenAt: string | null;
  sort: number;
}

export interface AdminNowItem {
  id: number;
  label: string;
  value: string;
  note: string | null;
  sort: number;
}

export interface AdminToolItem {
  id: number;
  name: string;
  category: string | null;
  note: string | null;
  url: string | null;
  sort: number;
}

export interface MediaItem {
  id: number;
  path: string;
  filename: string;
  width: number | null;
  height: number | null;
  size: number | null;
  mime: string | null;
  createdAt: string;
}

export interface UploadResult {
  id: number;
  path: string;
  thumb: string | null;
  filename: string;
  width: number | null;
  height: number | null;
  size: number | null;
  mime: string | null;
}

export interface Subscriber {
  id: number;
  email: string;
  ip: string | null;
  createdAt: string;
}

export interface Stats {
  posts: number;
  drafts: number;
  works: number;
  gallery: number;
  subscribers: number;
  words: number;
  recentPosts: AdminPostRow[];
}

export interface SettingsMap {
  name: string;
  role: string;
  status: string;
  intro: string;
  bio: string;
  avatar: string;
  since: string;
  location: string;
  email: string;
  socials: string;
  footerNote: string;
  newsletterNote: string;
}

export interface SocialRow {
  label: string;
  url: string;
}
