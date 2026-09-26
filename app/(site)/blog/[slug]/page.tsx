import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, User, ArrowRight, ExternalLink, Globe, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { blogApi } from "@/lib/resources";
import { DEFAULT_BLOG_POSTS, RECOMMENDED_QURAN_RESOURCES } from "@/lib/curated-quran";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const defaultSlugs = DEFAULT_BLOG_POSTS.map((post) => ({ slug: post.slug }));
  try {
    const posts = await blogApi.list();
    if (Array.isArray(posts) && posts.length > 0) {
      const allSlugs = new Set([...defaultSlugs.map((s) => s.slug), ...posts.map((p) => p.slug)]);
      return Array.from(allSlugs).map((slug) => ({ slug }));
    }
  } catch {
    // Backend API might not be reachable at build time
  }
  return defaultSlugs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = await blogApi.bySlug(slug).catch(() => null);
  if (!post) {
    post = DEFAULT_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }
  return { title: post?.title || "مقال قرآني" };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = await blogApi.bySlug(slug).catch(() => null);
  if (!post) {
    post = DEFAULT_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }

  if (!post) {
    return (
      <article className="py-16 sm:py-24">
        <Container className="max-w-3xl text-center">
          <h1 className="font-ruqaa text-4xl font-bold leading-[1.6] text-ink">المقال غير متوفر حالياً</h1>
          <Link href="/blog" className="inline-flex items-center gap-2 mt-6 text-brand-ink font-bold">
            <ArrowRight size={16} />
            العودة لكل المقالات
          </Link>
        </Container>
      </article>
    );
  }

  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <article className="py-14 sm:py-24">
      <Container className="max-w-3xl">
        <div className="mb-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-ink-mute hover:text-brand-ink transition-colors">
            <ArrowRight size={14} />
            العودة إلى المدونة
          </Link>
        </div>

        <Reveal>
          <Badge>{post.category}</Badge>
          <h1 className="font-ruqaa font-bold text-[clamp(2rem,5vw,3.2rem)] text-ink leading-[1.65] mt-4 text-balance">
            {post.title}
          </h1>

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

        <Reveal delay={0.1} className="max-w-none mt-10 text-base sm:text-lg leading-loose text-ink-soft whitespace-pre-line bg-surface p-6 sm:p-8 rounded-3xl border border-line/60">
          {post.content}
        </Reveal>

        {/* قسم روابط قرآنية مقترحة داخل المقال */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-brand-soft/50 border border-brand/20">
          <div className="flex items-center gap-2 text-brand-ink font-bold text-sm mb-2">
            <BookOpen size={16} />
            روابط ومصادر قرآنية موصى بها
          </div>
          <p className="text-xs sm:text-sm text-ink-soft mb-5">
            إذا كنت تبحث عن مصادر معتمدة لمتابعة تلاوتك وتفسيرك، ننصحك بزيارة المنصات التالية:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RECOMMENDED_QURAN_RESOURCES.slice(0, 4).map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-line hover:border-brand/40 group text-sm font-semibold transition-all"
              >
                <div className="flex items-center gap-2 text-ink group-hover:text-brand-ink">
                  <Globe size={15} className="text-brand shrink-0" />
                  <span className="truncate">{r.title}</span>
                </div>
                <ExternalLink size={14} className="text-ink-mute group-hover:text-brand-ink shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </article>
  );
}
