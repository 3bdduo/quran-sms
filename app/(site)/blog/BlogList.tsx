"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BookText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { Reveal } from "@/components/ui/Reveal";
import { blogApi } from "@/lib/resources";
import type { BlogPost } from "@/types";

const categories = ["فوائد قرآنية", "تجويد", "تربية", "أخبار المدرسة"];

const chip = (active: boolean) =>
  `inline-flex items-center min-h-11 px-4 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ${
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
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category]);

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
      ) : posts.length === 0 ? (
        <p className="text-center text-ink-mute mt-16">لا توجد مقالات في هذا التصنيف حاليًا</p>
      ) : (
        <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 0.08} className="h-full">
              <Link href={`/blog/${post.slug}`} className="group card-interactive h-full flex flex-col overflow-hidden">
                <div className="relative h-44 sm:h-48 bg-brand-soft overflow-hidden">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-brand-ink/50">
                      <BookText size={40} />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1">
                  <Badge>{post.category}</Badge>
                  <h3 className="font-extrabold text-ink text-lg mt-3 leading-snug group-hover:text-brand-ink transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-ink-soft mt-2 line-clamp-2">{post.excerpt}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
