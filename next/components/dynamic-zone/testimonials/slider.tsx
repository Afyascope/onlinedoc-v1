"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const TestimonialsSlider = ({ testimonials }: { testimonials: any }) => {
  const [active, setActive] = useState<number>(0);
  const [autorotate, setAutorotate] = useState<boolean>(true);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  // Safely handle if testimonials is undefined or empty
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const slicedTestimonials = safeTestimonials.slice(0, 5); // Increased to 5 in case you want more tips

  useEffect(() => {
    if (!autorotate || slicedTestimonials.length === 0) return;
    const interval = setInterval(() => {
      setActive(
        active + 1 === slicedTestimonials.length ? 0 : (active) => active + 1
      );
    }, 7000);
    return () => clearInterval(interval);
  }, [active, autorotate, slicedTestimonials.length]);

  const heightFix = () => {
    if (testimonialsRef.current && testimonialsRef.current.parentElement)
      testimonialsRef.current.parentElement.style.height = `${testimonialsRef.current.clientHeight}px`;
  };

  useEffect(() => {
    heightFix();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        heightFix();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (slicedTestimonials.length === 0) return null;

  return (
    <section>
      <div className="max-w-3xl mx-auto relative z-30 min-h-[300px]">
        <div className="relative pb-12 md:pb-20">
          
          {/* Carousel */}
          <div className="text-center">
            {/* Doctor Image / Avatar */}
            <div className="relative h-40">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] -z-10 pointer-events-none before:rounded-full rounded-full before:absolute before:inset-0 before:bg-gradient-to-b before:from-lightblack/20 before:to-transparent before:to-20% after:rounded-full after:absolute after:inset-0 after:bg-charcoal after:m-px before:-z-20 after:-z-20">
                {slicedTestimonials.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-&lsqb;cubic-bezier(0.68,-0.3,0.32,1)&rsqb; duration-700 order-first"
                    enterFrom="opacity-0 -translate-x-20"
                    enterTo="opacity-100 translate-x-0"
                    leave="transition ease-&lsqb;cubic-bezier(0.68,-0.3,0.32,1)&rsqb; duration-700"
                    leaveFrom="opacity-100 translate-x-0"
                    leaveTo="opacity-0 translate-x-20"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="absolute inset-0 h-full -z-10">
                      <Image
                        className="relative top-11 left-1/2 -translate-x-1/2 rounded-full border-2 border-charcoal shadow-2xl"
                        src={strapiImage(item.user.image.url)}
                        width={64}
                        height={64}
                        alt={`${item.user.firstname} ${item.user.lastname}`}
                      />
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* The Clinical Pearl (Text) */}
            <div className="mb-10 transition-all duration-150 delay-300 ease-in-out px-8 sm:px-6">
              <div className="relative flex flex-col" ref={testimonialsRef}>
                {slicedTestimonials.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-in-out duration-500 delay-200 order-first"
                    enterFrom="opacity-0 -translate-x-4"
                    enterTo="opacity-100 translate-x-0"
                    leave="transition ease-out duration-300 delay-300 absolute"
                    leaveFrom="opacity-100 translate-x-0"
                    leaveTo="opacity-0 translate-x-4"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="text-xl md:text-2xl font-medium text-white leading-relaxed font-primary">
                      &quot;{item.text}&quot;
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Navigation Tabs (Doctors Names) */}
            <div className="flex flex-wrap justify-center -m-1.5 px-8 sm:px-6">
              {slicedTestimonials.map((item: any, index: number) => (
                <button
                  className={cn(
                    `px-4 py-2 rounded-full m-1.5 text-xs md:text-sm border transition duration-200 ease-in-out font-secondary
                     bg-neutral-900/50 backdrop-blur-sm
                    ${active === index
                      ? "border-lightblack text-white shadow-[0_0_15px_rgba(0,194,203,0.3)]" // Active: Cyan Glow
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-600" // Inactive: Muted
                    }`
                  )}
                  key={index}
                  onClick={() => {
                    setActive(index);
                    setAutorotate(false);
                  }}
                >
                  <span className="flex flex-col sm:flex-row items-center gap-1">
                    <span className="font-bold">
                      {item.user.firstname} {item.user.lastname}
                    </span>
                    <span className="hidden sm:inline-block opacity-50">|</span>
                    <span className="text-lightblack">
                      {item.user.job}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};