import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { blogApi } from "@/lib/resources";

export const metadata: Metadata = { title: "المدونة" };

const categories = ["فوائد قرآنية", "تجويد", "تربية", "أخبار المدرسة"];

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const posts = await blogApi.list(category).catch(() => []);

  return (
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="المدونة" title="مقالات وفوائد" />

        <div className="flex flex-wrap justify-center gap-2 mt-10">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm font-bold ${!category ? "bg-emerald-600 text-cream-50" : "bg-white text-emerald-900 border border-emerald-900/10"}`}
          >
            الكل
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              className={`px-4 py-2 rounded-full text-sm font-bold ${category === c ? "bg-emerald-600 text-cream-50" : "bg-white text-emerald-900 border border-emerald-900/10"}`}
            >
              {c}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-emerald-900/50 mt-16">لا توجد مقالات في هذا التصنيف حاليًا</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-emerald-900/5 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 bg-emerald-100">
                  {post.cover_image ? (
                    <Image src={post.cover_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-300">
                      <BookText size={40} />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <Badge>{post.category}</Badge>
                  <h3 className="font-extrabold text-emerald-950 text-lg mt-3 leading-snug group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-emerald-900/60 mt-2 line-clamp-2">{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
