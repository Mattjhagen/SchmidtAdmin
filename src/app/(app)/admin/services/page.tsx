import type { Metadata } from 'next';
import ServicesEditor from './ServicesEditor';

export const metadata: Metadata = { title: 'Service Pages Editor' };

export default function ServicesPage() {
  return <ServicesEditor />;
}
