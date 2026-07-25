import { Container } from "@/components/container";

export default function Loading() {
  return (
    <div className="relative overflow-hidden py-40">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded-md mx-auto mb-6" />
          <div className="h-6 w-96 bg-neutral-200 animate-pulse rounded-md mx-auto mb-12" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-neutral-200 animate-pulse rounded-md" />
            <div className="h-4 w-5/6 bg-neutral-200 animate-pulse rounded-md mx-auto" />
            <div className="h-4 w-4/6 bg-neutral-200 animate-pulse rounded-md mx-auto" />
          </div>
        </div>
      </Container>
    </div>
  );
}
