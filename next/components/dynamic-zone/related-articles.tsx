"use client";
import React from "react";
import { motion } from "framer-motion";
import { BlogCardVertical } from "../blog-card";
import { Container } from "../container";

export const RelatedArticles = ({ heading, sub_heading, articles, locale }: { heading: string; sub_heading: string; articles: any[], locale: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Container className="py-20 relative z-20 border-t border-border/50">
      <div className="flex flex-col mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-primary font-primary">
          {heading}
        </h2>
        {sub_heading && (
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl font-secondary">
            {sub_heading}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {articles.map((article) => (
          <BlogCardVertical key={article.title} article={article} locale={locale} />
        ))}
      </div>
    </Container>
    </motion.div>
  );
};