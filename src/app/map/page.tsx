import type { Metadata } from 'next';
import { ProofFlow } from '../../components/ProofFlow';

export const metadata: Metadata = {
  title: 'PROOF · 15 answers',
  description: '15 answers that show where Digital Fog turns into Digital Friction in your business.',
};

export default function MapPage() {
  return <ProofFlow startAt="ask" />;
}
