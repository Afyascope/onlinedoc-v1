import React from "react";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";

// 1. Fetch Data Function
async function getServicePageData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/service-page`,
      { cache: "no-store" } // Ensures you see updates immediately
    );
    
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching service page:", error);
    return null;
  }
}

export default async function ServicesPage() {
  const response = await getServicePageData();
  const data = response?.data;
  
  // Guard clause: If no content exists yet
  if (!data) {
    return (
      <div className="min-h-screen bg-[#020617] pt-32 text-center text-white">
        <h1 className="text-2xl font-bold">Services Coming Soon</h1>
        <p className="text-neutral-400 mt-2">We are updating our service list.</p>
      </div>
    );
  }

  const { title, content } = data.attributes;

  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-16 border-b border-white/10 pb-8">
           <Heading className="text-white mb-4">{title}</Heading>
           <Subheading className="text-cyan-400">
             What we offer at AfyaScope
           </Subheading>
        </div>

        {/* Dynamic Content Section */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-cyan-400 prose-a:text-blue-400 prose-li:text-neutral-300">
          <BlocksRenderer content={content} />
        </div>

      </div>
    </div>
  );
}