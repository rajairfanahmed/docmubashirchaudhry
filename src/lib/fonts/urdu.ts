import { Noto_Nastaliq_Urdu } from 'next/font/google';

/**
 * Conditionally imported only on quiz/question surfaces requiring Urdu script
 * so English-only public routes pay zero Urdu font weight overhead.
 */
export const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
  display: 'swap',
  adjustFontFallback: false
});

