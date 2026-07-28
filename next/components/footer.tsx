import React from "react";
import { Logo } from "@/components/logo";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { FaXTwitter, FaLinkedin, FaGithub, FaInstagram, FaFacebook } from "react-icons/fa6";

export const Footer = async ({ data, locale }: { data: any, locale: string }) => {
  return (
    <div className="relative">
      <div 
        className={cn(
          "border-t px-8 pt-20 pb-10 relative",
          "bg-surface border-border"
        )}
      >
        <div className="max-w-7xl mx-auto text-sm text-neutral-600 flex flex-col md:flex-row justify-between items-start gap-10">
          
          <div>
            <div className="mr-4 md:flex mb-6">
              {data?.logo?.image && (
                <Logo image={data?.logo?.image} />
              )}
            </div>
            
            <div className="max-w-xs font-secondary text-neutral-600 leading-relaxed text-sm">
              {data?.description}
            </div>
            
            <div className="mt-8 font-secondary text-neutral-500 text-xs">
              {data?.copyright}
            </div>
            
            <div className="mt-2 text-xs text-neutral-500 font-secondary">
              Designed and Developed by{" "}
              <a 
                className="text-brand hover:text-brand-hover transition-colors duration-200 font-bold font-primary" 
                href="https://afyascope.co.ke"
              >
                Afyascope Digital
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 items-start w-full md:w-auto">
            <div className="flex flex-col space-y-4">
               <h4 className="text-primary font-bold font-primary">Company</h4>
               <LinkSection links={data?.internal_links} locale={locale} />
            </div>

            <div className="flex flex-col space-y-4">
                <h4 className="text-primary font-bold font-primary">Legal</h4>
                <LinkSection links={data?.policy_links} locale={locale} />
            </div>

            <div className="flex flex-col space-y-4">
                <h4 className="text-primary font-bold font-primary">Connect</h4>
                <SocialLinks links={data?.social_media_links} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkSection = ({ links, locale }: { links?: { text: string; URL: never | string }[], locale: string }) => (
  <div className="flex flex-col space-y-3">
    {links?.map((link) => (
      <Link
        key={link.text}
        className="transition-colors text-neutral-500 hover:text-brand text-sm font-secondary"
        href={`${link.URL.startsWith('http') ? '' : `/${locale}`}${link.URL}`}
      >
        {link.text}
      </Link>
    ))}
  </div>
);

const SocialLinks = ({ links }: { links?: { text: string; URL: string }[] }) => {
  const getIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("twitter") || lower.includes("x")) return <FaXTwitter />;
    if (lower.includes("linkedin")) return <FaLinkedin />;
    if (lower.includes("github")) return <FaGithub />;
    if (lower.includes("instagram")) return <FaInstagram />;
    if (lower.includes("facebook")) return <FaFacebook />;
    return null;
  };

  return (
    <div className="flex gap-4">
      {links?.map((link) => {
        const icon = getIcon(link.text);
        return (
          <a
            key={link.text}
            href={link.URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-brand hover:scale-110 transition-all duration-200 text-xl"
            title={link.text}
            aria-label={link.text}
          >
            {icon ? icon : <span className="text-xs">{link.text}</span>}
          </a>
        );
      })}
    </div>
  );
};
