import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconPencil, IconExternalLink, IconArticle, IconPageBreak, IconSettings } from "@tabler/icons-react";

export default function ContentPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Content"
        description="Manage site content and pages"
      />

      <DashboardShell>
        <ActivityCard title="Managed Pages">
          <div className="space-y-3">
            <ContentLink
              icon={<IconArticle size={18} />}
              title="Blog Posts"
              description="Manage blog articles and posts"
            />
            <ContentLink
              icon={<IconPageBreak size={18} />}
              title="Service Pages"
              description="Edit service descriptions and pricing"
            />
            <ContentLink
              icon={<IconSettings size={18} />}
              title="Site Settings"
              description="Configure site-wide content settings"
            />
          </div>
        </ActivityCard>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <IconPencil size={40} stroke={1.5} />
            <p className="mt-4 text-sm text-neutral-500 font-secondary text-center max-w-md">
              Content management is handled through the Strapi CMS backend.
              Pages and content created there are automatically reflected on the site.
            </p>
            <a
              href="http://localhost:1337/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors"
            >
              Open Strapi Admin
              <IconExternalLink size={16} />
            </a>
          </div>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}

function ContentLink({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-brand/20 hover:bg-neutral-50 transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <IconExternalLink size={16} className="text-neutral-300" />
    </div>
  );
}
