import type { Metadata } from 'next';
import { ProofFlow } from '../../components/ProofFlow';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PROOF · 15 answers',
  description: '15 answers that show where Workflow Friction shows up in the business.',
};

export default function MapPage() {
  return <ProofFlow startAt="ask" />;
}
