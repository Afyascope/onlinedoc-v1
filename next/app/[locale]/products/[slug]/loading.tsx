import { Container } from "@/components/container";

export default function ProductLoading() {
  return (
    <div className="relative overflow-hidden py-40">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-neutral-200 animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-neutral-200 animate-pulse rounded-md" />
            <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded-full" />
            <div className="h-4 w-full bg-neutral-200 animate-pulse rounded-md" />
            <div className="h-4 w-5/6 bg-neutral-200 animate-pulse rounded-md" />
            <div className="h-4 w-4/6 bg-neutral-200 animate-pulse rounded-md" />
          </div>
        </div>
      </Container>
    </div>
  );
}
