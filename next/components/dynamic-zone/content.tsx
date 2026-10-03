import { BlocksRenderer } from "@strapi/blocks-react-renderer";

export function Content({ content }: { content: any[] }) {
  if (!content?.length) return null;

  return (
    <section className="py-12">
      <div className="prose prose-lg mx-auto max-w-4xl px-6">
        <BlocksRenderer content={content} />
      </div>
    </section>
  );
}
