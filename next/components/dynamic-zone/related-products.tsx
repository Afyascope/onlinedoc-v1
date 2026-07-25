"use client";
import React from "react";
import { Container } from "../container"; // Importing Container for alignment
import { ProductItems } from "@/components/products/product-items";

export const RelatedProducts = ({ heading, sub_heading, products, locale }: { heading: string; sub_heading: string; products: any[], locale: string }) => {
  return (
    <div className="py-20 relative z-20">
      <Container>
        {/* We pass the headings down to ProductItems, but wrapping it in Container ensures it aligns with your Navbar */}
        <ProductItems 
          heading={heading} 
          sub_heading={sub_heading} 
          products={products} 
          locale={locale} 
        />
      </Container>
    </div>
  );
};