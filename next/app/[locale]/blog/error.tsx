"use client";

import { Container } from "@/components/container";
import { Button } from "@/components/elements/button";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative overflow-hidden py-40">
      <Container className="flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary font-primary">
          Blog unavailable
        </h1>
        <p className="text-neutral-600 mt-4 max-w-md font-secondary">
          We couldn&apos;t load the blog. Please try again.
        </p>
        <Button
          onClick={reset}
          variant="primary"
          className="mt-8"
        >
          Try again
        </Button>
      </Container>
    </div>
  );
}
