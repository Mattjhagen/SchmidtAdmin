import type { Metadata } from 'next';
import SiteInfoEditor from './SiteInfoEditor';

export const metadata: Metadata = { title: 'Site Info Editor' };

export default function SiteInfoPage() {
  return <SiteInfoEditor />;
}
