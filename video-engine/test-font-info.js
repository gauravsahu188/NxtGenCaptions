const fonts = [
  'NotoSansDevanagari',
  'NotoSansTamil',
  'NotoSansBengali',
  'NotoSansTelugu',
  'NotoSansKannada',
  'NotoSansMalayalam',
  'NotoSansGujarati',
  'NotoSansGurmukhi',
  'NotoSansOriya',
  'NotoSansArabic'
];

fonts.forEach(f => {
  try {
    const { getInfo } = require(`@remotion/google-fonts/${f}`);
    console.log(`${f} -> fontFamily: "${getInfo().fontFamily}"`);
  } catch (err) {
    console.log(`Failed to load ${f}:`, err.message);
  }
});
