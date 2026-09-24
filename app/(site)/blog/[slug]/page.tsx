import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
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
          <h1 className="font-ruqaa text-4xl font-bold leading-[1.6] text-ink">المقال غير متوفر حالياً</h1>
        </Container>
      </article>
    );
  }

  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <article className="py-14 sm:py-24">
      <Container className="max-w-3xl">
        <Reveal>
        <Badge>{post.category}</Badge>
        <h1 className="font-ruqaa font-bold text-[clamp(2rem,5.5vw,3.4rem)] text-ink leading-[1.65] mt-4 text-balance">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-mute font-semibold mt-4">
          <span className="flex items-center gap-1.5"><User size={15} /> {post.author}</span>
          {date && <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {date}</span>}
        </div>

        </Reveal>

        {post.cover_image && (
          <Reveal from="scale" delay={0.1} className="relative h-64 sm:h-96 rounded-3xl overflow-hidden mt-8 sh-float">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" priority />
          </Reveal>
        )}

        <Reveal delay={0.1} className="max-w-none mt-10 text-base sm:text-lg leading-loose text-ink-soft whitespace-pre-line">
          {post.content}
        </Reveal>
      </Container>
    </article>
  );
}
