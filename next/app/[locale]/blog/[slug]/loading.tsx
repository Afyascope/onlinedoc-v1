import { Container } from "@/components/container";

export default function ArticleLoading() {
  return (
    <Container className="mt-20 lg:mt-32 mb-20">
      <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded-md mb-8" />
      <div className="aspect-video md:h-[500px] bg-neutral-200 animate-pulse rounded-2xl mb-10" />
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-3/4 bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-4 w-1/4 bg-neutral-200 animate-pulse rounded-md mb-8" />
        <div className="h-4 w-full bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-4 w-5/6 bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-4 w-4/6 bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-4 w-full bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-4 w-3/4 bg-neutral-200 animate-pulse rounded-md" />
      </div>
    </Container>
  );
}
