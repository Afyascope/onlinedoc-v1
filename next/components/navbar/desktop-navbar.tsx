"use client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/elements/button";
import { NavbarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "next-view-transitions";
import { LocaleSwitcher } from "../locale-switcher";

type Props = {
  leftNavbarItems: {
    URL: string;
    text: string;
    target?: string;
  }[];
  rightNavbarItems: {
    URL: string;
    text: string;
    target?: string;
  }[];
  logo: any;
  locale: string;
};

export const DesktopNavbar = ({ leftNavbarItems, rightNavbarItems, logo, locale }: Props) => {
  const { scrollY } = useScroll();

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });

  return (
    <motion.div
      className={cn(
        "w-full flex relative justify-between px-4 py-3 rounded-full transition duration-200 bg-transparent mx-auto"
      )}
      animate={{
        /* 1. Width Animation: Shrinks to 80% for that "Floating Pill" look */
        width: showBackground ? "80%" : "100%",
        
        /* 2. Glassmorphism Background: Afyascope Navy with 80% Opacity */
        background: showBackground ? "rgba(0, 31, 63, 0.8)" : "transparent",
        
        /* 3. The Blur Effect */
        backdropFilter: showBackground ? "blur(12px)" : "blur(0px)",
        
        /* 4. Subtle White Border for "Glass Edge" */
        border: showBackground ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid transparent",
        
        /* 5. Shadow for depth */
        boxShadow: showBackground ? "0px 10px 30px rgba(0,0,0,0.2)" : "none"
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
            }}
            /* Changed bg-neutral-900 to bg-charcoal to match your theme */
            className="absolute inset-0 h-full w-full bg-charcoal pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent,white)] rounded-full opacity-50"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-row gap-2 items-center">
        <Logo locale={locale} image={logo?.image} />
        <div className="flex items-center gap-1.5">
          {leftNavbarItems.map((item) => (
            <NavbarItem href={`/${locale}${item.URL}` as never} key={item.text} target={item.target}>
              {item.text}
            </NavbarItem>
          ))}
        </div>
      </div>
      <div className="flex space-x-2 items-center">
        <LocaleSwitcher currentLocale={locale} />

        {rightNavbarItems.map((item, index) => (
          <Button 
            key={item.text} 
            /* Logic: Last item is Primary (Coral Red), others are Simple/Glass */
            variant={index === rightNavbarItems.length - 1 ? 'primary' : 'simple'} 
            as={Link} 
            href={`/${locale}${item.URL}`}
          >
            {item.text}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};