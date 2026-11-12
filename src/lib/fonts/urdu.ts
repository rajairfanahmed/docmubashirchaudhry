import localFont from 'next/font/local';

/**
 * Conditionally imported only on quiz/question surfaces requiring Urdu script
 * so English-only public routes pay zero Urdu font weight overhead.
 */
export const notoNastaliqUrdu = localFont({
  src: '../../app/fonts/noto-nastaliq-urdu-arabic.woff2',
  weight: '400 700',
  variable: '--font-urdu',
  display: 'swap',
  adjustFontFallback: false
});
