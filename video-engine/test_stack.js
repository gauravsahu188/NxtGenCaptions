const NOTO_FALLBACK_STACK = [
  "'Noto Sans Devanagari'",
  "'Noto Sans Tamil'",
  "'Noto Sans Bengali'",
  "'Noto Sans Telugu'",
  "'Noto Sans Kannada'",
  "'Noto Sans Malayalam'",
  "'Noto Sans Gujarati'",
  "'Noto Sans Gurmukhi'",
  "'Noto Sans Oriya'",
  "'Noto Sans Arabic'",
  "sans-serif",
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"',
].join(", ");

function buildFontStack(fontFamily) {
  const primary = fontFamily || "Inter";
  return `'${primary}', ${NOTO_FALLBACK_STACK}`;
}
console.log(buildFontStack("Inter"));
console.log(buildFontStack("Noto Sans Malayalam"));
