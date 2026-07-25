import { Container } from "@/components/container";

export default function ProductsLoading() {
  return (
    <div className="relative overflow-hidden pt-40">
      <Container>
        <div className="flex flex-col items-center text-center mb-20">
          <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded-md mx-auto mb-4" />
          <div className="h-6 w-96 bg-neutral-200 animate-pulse rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-16">
            <div className="h-6 w-64 bg-neutral-200 animate-pulse rounded-md mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video bg-neutral-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 w-3/4 bg-neutral-200 animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-neutral-200 animate-pulse rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}
