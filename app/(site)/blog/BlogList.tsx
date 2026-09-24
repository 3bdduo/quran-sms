"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BookText, ExternalLink, Globe, Sparkles, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { Reveal } from "@/components/ui/Reveal";
import { blogApi } from "@/lib/resources";
import { DEFAULT_BLOG_POSTS, RECOMMENDED_QURAN_RESOURCES } from "@/lib/curated-quran";
import type { BlogPost } from "@/types";

const categories = ["فوائد قرآنية", "تجويد", "تربية", "أخبار المدرسة"];

const chip = (active: boolean) =>
  `inline-flex items-center min-h-11 px-4 rounded-full text-sm font-bold transition-all duration-[1000ms] active:scale-95 ${
    active
      ? "bg-brand text-on-brand sh-brand"
      : "bg-surface text-ink-soft border border-line sh-soft hover:border-brand hover:text-brand-ink"
  }`;

export default function BlogList() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogApi
      .list(category)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setPosts(res);
        } else {
          // استخدام المقالات الموصى بها افتراضياً
          const filtered = category
            ? DEFAULT_BLOG_POSTS.filter((p) => p.category === category)
            : DEFAULT_BLOG_POSTS;
          setPosts(filtered);
        }
      })
      .catch(() => {
        const filtered = category
          ? DEFAULT_BLOG_POSTS.filter((p) => p.category === category)
          : DEFAULT_BLOG_POSTS;
        setPosts(filtered);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const displayPosts = posts.length > 0 ? posts : (category ? DEFAULT_BLOG_POSTS.filter((p) => p.category === category) : DEFAULT_BLOG_POSTS);

  return (
    <>
      <Reveal delay={0.1} className="flex flex-wrap justify-center gap-2.5 mt-10">
        <Link href="/blog" className={chip(!category)}>
          الكل
        </Link>
        {categories.map((c) => (
          <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className={chip(category === c)}>
            {c}
          </Link>
        ))}
      </Reveal>

      {loading ? (
        <Loader />
      ) : displayPosts.length === 0 ? (
        <p className="text-center text-ink-mute mt-16">لا توجد مقالات في هذا التصنيف حاليًا</p>
      ) : (
        <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {displayPosts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 0.08} className="h-full">
              <Link href={`/blog/${post.slug}`} className="group card-interactive h-full flex flex-col overflow-hidden !rounded-2xl border border-line hover:border-brand/40">
                <div className="relative h-44 sm:h-48 bg-brand-soft overflow-hidden">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-[1600ms] group-hover:scale-110"
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-brand-ink/50 bg-gradient-to-br from-brand-soft to-surface-2">
                      <BookText size={44} />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <Badge>{post.category}</Badge>
                    <h3 className="font-extrabold text-ink text-lg mt-3 leading-snug group-hover:text-brand-ink transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-ink-soft mt-2.5 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center justify-between text-xs font-bold text-brand-ink">
                    <span>قراءة المقال كاملاً</span>
                    <ArrowLeft size={14} className="group-hover:translate-x-[-3px] transition-transform" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {/* قسم الروابط القرآنية الموصى بها في صفحة المدونة */}
      <div className="mt-20 pt-14 border-t border-line/60">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand-ink text-xs font-bold mb-3">
            <Sparkles size={14} />
            روابط ومراجع موصى بها
          </div>
          <h2 className="font-ruqaa font-bold text-2xl sm:text-3xl text-ink leading-snug">
            أهم المواقع والتطبيقات المعتمدة في خدمة القرآن
          </h2>
          <p className="text-ink-soft text-xs sm:text-sm mt-2">
            روابط مباشرة لأفضل المصاحف الرقمية، محركات البحث في التفسير، وتطبيقات الحفظ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RECOMMENDED_QURAN_RESOURCES.slice(0, 4).map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-interactive p-5 !rounded-2xl border border-line hover:border-brand/40 flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-md">
                  {r.badge}
                </span>
                <h4 className="font-bold text-ink text-sm mt-2.5 group-hover:text-brand-ink transition-colors leading-snug">
                  {r.title}
                </h4>
                <p className="text-xs text-ink-soft mt-1.5 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-line/60 flex items-center justify-between text-[11px] font-bold text-brand-ink">
                <span className="flex items-center gap-1">
                  <Globe size={12} />
                  فتح الرابط
                </span>
                <ExternalLink size={12} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
