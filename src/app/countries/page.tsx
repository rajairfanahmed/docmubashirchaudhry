import { permanentRedirect } from 'next/navigation';

export default function LegacyCountriesRedirectPage() {
  permanentRedirect('/geography');
}
