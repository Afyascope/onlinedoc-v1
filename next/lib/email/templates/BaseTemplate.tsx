import type { ReactNode } from "react";
import { siteUrl } from "@/lib/config";

export const emailColors = { primary: "#0F2A43", brand: "#2CB1BC", background: "#F8FAFC" };

export function BaseTemplate({ title, preview, children }: { title: string; preview?: string; children: ReactNode }) {
  const support = process.env.EMAIL_REPLY_TO || "support@onlinedoc.co.ke";
  const appUrl = siteUrl();
  return (
    <html lang="en">
      <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{title}</title></head>
      <body style={{ margin: 0, backgroundColor: emailColors.background, color: emailColors.primary, fontFamily: "Arial, Helvetica, sans-serif" }}>
        {preview ? <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>{preview}</div> : null}
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: emailColors.background }}>
          <tbody><tr><td align="center" style={{ padding: "32px 16px" }}>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 600, backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden" }}>
              <tbody>
                <tr><td style={{ padding: "28px 32px", borderBottom: "1px solid #E2E8F0" }}><a href={appUrl} style={{ color: emailColors.primary, textDecoration: "none", fontSize: 24, fontWeight: 700 }}>Online<span style={{ color: emailColors.brand }}>Doc</span></a></td></tr>
                <tr><td style={{ padding: "32px" }}>{children}</td></tr>
                <tr><td style={{ padding: "24px 32px", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 8px" }}>Need help? <a href={`mailto:${support}`} style={{ color: emailColors.brand }}>{support}</a></p>
                  <p style={{ margin: 0 }}><a href={`${appUrl}/privacy`} style={{ color: "#64748B" }}>Privacy Policy</a> · © {new Date().getFullYear()} OnlineDoc</p>
                </td></tr>
              </tbody>
            </table>
          </td></tr></tbody>
        </table>
      </body>
    </html>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} style={{ display: "inline-block", backgroundColor: emailColors.brand, color: "#ffffff", padding: "13px 22px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>{children}</a>;
}

export function EmailHeading({ children }: { children: ReactNode }) { return <h1 style={{ margin: "0 0 16px", color: emailColors.primary, fontSize: 24, lineHeight: 1.25 }}>{children}</h1>; }
export function EmailText({ children }: { children: ReactNode }) { return <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.65 }}>{children}</p>; }
