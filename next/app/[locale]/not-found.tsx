import { Metadata } from "next";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { Link } from "next-view-transitions";

export const metadata: Metadata = {
  title: "Page Not Found | OnlineDoc Healthcare",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="relative overflow-hidden py-40">
      <Container className="flex flex-col items-center text-center">
        <Heading as="h1" className="text-6xl md:text-8xl text-brand">
          404
        </Heading>
        <Subheading className="max-w-md mx-auto mt-4">
          The page you are looking for does not exist or has been moved.
        </Subheading>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-brand hover:text-brand-hover transition-colors font-medium"
        >
          Back to Home
        </Link>
      </Container>
    </div>
  );
}
