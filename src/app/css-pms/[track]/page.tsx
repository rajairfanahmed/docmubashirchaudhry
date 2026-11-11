import { permanentRedirect } from 'next/navigation';

export default function DeprecatedCssTrackRedirectPage() {
  permanentRedirect('/css-pms');
}
