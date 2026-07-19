import type { Metadata } from 'next';
import PortfolioEditor from './PortfolioEditor';

export const metadata: Metadata = { title: 'Portfolio Editor' };

export default function PortfolioPage() {
  return <PortfolioEditor />;
}
