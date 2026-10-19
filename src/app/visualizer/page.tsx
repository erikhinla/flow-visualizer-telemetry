import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';

export const metadata: Metadata = {
  title: 'Desk model · PROOF',
  description:
    'A sample desk model. Your counts replace the sample. A blank stays unknown, and PROOF will not invent a result.',
};

export default function VisualizerPage() {
  return (
    <Suspense fallback={<p className="note">Opening the desk…</p>}>
      <VisualizerExperience />
    </Suspense>
  );
}
