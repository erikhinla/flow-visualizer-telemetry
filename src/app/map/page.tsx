import type { Metadata } from 'next';
import { ProofFlow } from '../../components/ProofFlow';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PROOF · AI Workflow Diagnostic',
  description: 'See where work stops moving between people, teams and AI. Progress stops where context drops.',
};

export default function MapPage() {
  return <ProofFlow startAt="ask" />;
}
