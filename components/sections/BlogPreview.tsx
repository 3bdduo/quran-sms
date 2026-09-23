import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { blogApi } from "@/lib/resources";

export async function BlogPreview() {
  const posts = await blogApi.list().catch(() => []);
  const latest = posts.slice(0, 3);

  return (
    <section className="py-20 bg-cream-100/50">
      <Container>
        <SectionHeading eyebrow="المدونة" title="أحدث المقالات والفوائد" />

        {latest.length === 0 ? (
          <p className="text-center text-emerald-900/50 mt-10">سيتم نشر أول مقال قريبًا بإذن الله</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {latest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-emerald-900/5 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-44 bg-emerald-100">
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

        <div className="mt-10 text-center">
          <ButtonLink href="/blog" variant="outline">
            <ArrowLeft size={18} />
            كل المقالات
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
