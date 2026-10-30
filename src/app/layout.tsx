import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AttributionCapture } from "@/components/AttributionCapture";
import { site } from "@/lib/site";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.title} | ${site.name}`,
  description: site.description,
  openGraph: {
    title: site.title,
    description: site.description,
    locale: "vi_VN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff9ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="min-h-dvh font-sans">
        <AttributionCapture />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
