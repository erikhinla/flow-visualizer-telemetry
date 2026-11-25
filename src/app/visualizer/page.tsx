import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dept model · PROOF',
  description:
    "A sample team model. Real counts replace the sample. A blank stays unknown, and PROOF won't invent a result.",
};

export default function VisualizerPage() {
  return (
    <Suspense fallback={<p className="note">Opening the dept…</p>}>
      <VisualizerExperience />
    </Suspense>
  );
}
