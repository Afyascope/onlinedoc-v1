import { Link } from "next-view-transitions";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(600px at 50% 30%, rgba(224,252,255,0.6) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm">
            OD
          </div>
          <span className="text-xl font-bold text-primary font-primary">
            <span className="text-primary">Online</span>
            <span className="text-brand">Doc</span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          {children}
        </div>

        <div className="mt-8 flex items-center gap-6 text-xs text-neutral-400 font-secondary">
          <a href="/privacy" className="hover:text-neutral-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-neutral-600 transition-colors">
            Terms &amp; Conditions
          </a>
        </div>
      </div>
    </div>
  );
}
