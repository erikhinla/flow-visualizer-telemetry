import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';

export const metadata: Metadata = {
  title: 'Team model · PROOF',
  description:
    "A sample team model. Real counts replace the sample. A blank stays unknown, and PROOF won't invent a result.",
};

export default function VisualizerPage() {
  return (
    <Suspense fallback={<p className="note">Opening the team…</p>}>
      <VisualizerExperience />
    </Suspense>
  );
}
