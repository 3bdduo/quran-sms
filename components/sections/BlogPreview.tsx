import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { blogApi } from "@/lib/resources";

export async function BlogPreview() {
  const posts = await blogApi.list().catch(() => []);
  const latest = posts.slice(0, 3);

  return (
    <section className="cv-auto py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="المدونة" title="أحدث المقالات والفوائد" />

        {latest.length === 0 ? (
          <p className="text-center text-ink-mute mt-10">سيتم نشر أول مقال قريبًا بإذن الله</p>
        ) : (
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {latest.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.1} className={`h-full ${i === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                <Link href={`/blog/${post.slug}`} className="group card-interactive h-full flex flex-col overflow-hidden">
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

        <Reveal className="mt-12 text-center">
          <ButtonLink href="/blog" variant="outline">
            <ArrowLeft size={18} />
            كل المقالات
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
