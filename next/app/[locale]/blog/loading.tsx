import { Container } from "@/components/container";

export default function BlogLoading() {
  return (
    <div className="relative overflow-hidden py-40">
      <Container>
        <div className="flex flex-col items-center text-center mb-20">
          <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded-md mx-auto mb-4" />
          <div className="h-6 w-96 bg-neutral-200 animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-neutral-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded-full" />
                <div className="h-5 w-full bg-neutral-200 animate-pulse rounded-md" />
                <div className="h-4 w-4/5 bg-neutral-200 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
