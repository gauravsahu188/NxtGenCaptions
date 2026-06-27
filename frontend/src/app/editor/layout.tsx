import { ReactNode } from "react";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        Load Indian script Noto fonts + Inter so the editor preview renders
        Sarvam AI captions (Hindi, Tamil, Bengali, etc.) without □□□ boxes.
      */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;900&family=Noto+Sans+Tamil:wght@400;700;900&family=Noto+Sans+Bengali:wght@400;700;900&family=Noto+Sans+Telugu:wght@400;700;900&family=Noto+Sans+Kannada:wght@400;700;900&family=Noto+Sans+Malayalam:wght@400;700;900&family=Noto+Sans+Gujarati:wght@400;700;900&family=Noto+Sans+Gurmukhi:wght@400;700;900&family=Noto+Sans+Oriya:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;700;900&display=swap"
      />
      {children}
    </>
  );
}
