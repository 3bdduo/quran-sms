import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { blogApi } from "@/lib/resources";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await blogApi.list();
    if (Array.isArray(posts) && posts.length > 0) {
      return posts.map((post) => ({ slug: post.slug }));
    }
  } catch {
    // Backend API might not be reachable at build time
  }
  return [{ slug: "welcome" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogApi.bySlug(slug).catch(() => null);
  return { title: post?.title || "مقال" };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await blogApi.bySlug(slug).catch(() => null);
  if (!post) {
    return (
      <article className="py-16 sm:py-24">
        <Container className="max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-emerald-950">المقال غير متوفر حالياً</h1>
        </Container>
      </article>
    );
  }

  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <article className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <Badge>{post.category}</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 leading-tight mt-4">{post.title}</h1>

        <div className="flex items-center gap-5 text-sm text-emerald-900/50 font-semibold mt-4">
          <span className="flex items-center gap-1.5"><User size={15} /> {post.author}</span>
          {date && <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {date}</span>}
        </div>

        {post.cover_image && (
          <div className="relative h-64 sm:h-96 rounded-3xl overflow-hidden mt-8">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="800px" priority />
          </div>
        )}

        <div className="prose prose-emerald max-w-none mt-10 text-lg leading-loose text-emerald-900/80 whitespace-pre-line">
          {post.content}
        </div>
      </Container>
    </article>
  );
}
