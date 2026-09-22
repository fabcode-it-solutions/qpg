import {
  SanityBlogPost,
  SanityCategory,
  TransformedCategory,
} from "@/lib/sanity";

export interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
  }>;
}

export interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export interface BlogBreadcrumbProps {
  postTitle: string;
  categories?: (SanityCategory | { _ref: string })[];
}

export interface BlogCardProps {
  post: SanityBlogPost;
  featured?: boolean;
}

export interface BlogCategoriesProps {
  categories: TransformedCategory[];
  selectedCategory?: string;
}

export interface BlogGridProps {
  posts: SanityBlogPost[];
}

export interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
}

export interface BlogPostProps {
  post: SanityBlogPost;
}

export interface BlogSearchProps {
  initialSearch?: string;
}

export interface RelatedPostsProps {
  posts: SanityBlogPost[];
}
