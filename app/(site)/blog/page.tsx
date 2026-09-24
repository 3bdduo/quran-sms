import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Loader } from "@/components/ui/Loader";
import BlogList from "./BlogList";

export const metadata: Metadata = { title: "المدونة" };

export default function BlogPage() {
  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading eyebrow="المدونة" title="مقالات وفوائد" />
        <Suspense fallback={<Loader />}>
          <BlogList />
        </Suspense>
      </Container>
    </div>
  );
}
