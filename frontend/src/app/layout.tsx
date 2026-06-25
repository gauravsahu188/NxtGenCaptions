import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nxtgencaptions.com"),
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
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Load Indian script Noto fonts + Inter so the editor preview renders
          Sarvam AI captions (Hindi, Tamil, Bengali, etc.) without □□□ boxes.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;900&family=Noto+Sans+Tamil:wght@400;700;900&family=Noto+Sans+Bengali:wght@400;700;900&family=Noto+Sans+Telugu:wght@400;700;900&family=Noto+Sans+Kannada:wght@400;700;900&family=Noto+Sans+Malayalam:wght@400;700;900&family=Noto+Sans+Gujarati:wght@400;700;900&family=Noto+Sans+Gurmukhi:wght@400;700;900&family=Noto+Sans+Oriya:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;700;900&display=swap"
        />
      </head>
      <body className={`${syne.variable} ${manrope.variable} antialiased`}>
        <Providers>
          <NextTopLoader
            color="#22c55e"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #22c55e,0 0 5px #22c55e"
          />
          {children}
        </Providers>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7E4WDL3Z8B"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-7E4WDL3Z8B');
          `}
        </Script>
      </body>
    </html>
  );
}
