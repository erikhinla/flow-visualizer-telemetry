import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';

export const metadata: Metadata = {
  title: 'Follow the work — Visualizer',
  description:
    'Ten department workflows. See repair hours, capacity pressure, and the wait curve before momentum is seized.',
};

export default function VisualizerPage() {
  return (
    <Suspense fallback={<p className="note">Opening the workflow…</p>}>
      <VisualizerExperience />
    </Suspense>
  );
}
