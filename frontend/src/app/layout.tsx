import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NxtGen Captions — Caption AI and AI Subtitle Generator",
  description: "Auto-generate stunning, accurate video captions with our AI subtitle generator. Auto subtitle generator featuring modern captions, .srt file exports, and alpha channel captions.",
  keywords: [
    "caption ai",
    "ai subtitle generator",
    "subtitle generator",
    "auto subtitle generator",
    "video subtitle generator",
    "caption",
    "ai caption generator",
    "caption generator",
    "modern captions",
    ".srt file",
    "alpha channel captions",
    "AI Captioning Software"
  ],
  openGraph: {
    title: "NxtGen Captions — Caption AI and AI Subtitle Generator",
    description: "Auto-generate stunning, accurate video captions with our AI subtitle generator. Auto subtitle generator featuring modern captions, .srt file exports, and alpha channel captions.",
    url: "https://nxtgencaptions.com",
    siteName: "NxtGen Captions",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NxtGen Captions - Caption AI & AI Subtitle Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NxtGen Captions — Caption AI and AI Subtitle Generator",
    description: "Auto-generate stunning, accurate video captions with our AI subtitle generator. Auto subtitle generator featuring modern captions, .srt file exports, and alpha channel captions.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${manrope.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FPBE0PCE4E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-FPBE0PCE4E');
          `}
        </Script>
      </body>
    </html>
  );
}
