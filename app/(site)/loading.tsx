import { Loader } from "@/components/ui/Loader";

export default function SiteLoading() {
  return (
    <div className="min-h-[60dvh] grid place-items-center">
      <Loader size="lg" />
    </div>
  );
}
