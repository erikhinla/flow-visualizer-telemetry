import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';

export const metadata: Metadata = {
  title: 'Desk — PROOF',
  description:
    'One agency desk. Reconstruction hours, the wait before a launch or flight seizes, and a connection that keeps the review.',
};

export default function VisualizerPage() {
  return (
    <Suspense fallback={<p className="note">Opening the workflow…</p>}>
      <VisualizerExperience />
    </Suspense>
  );
}
