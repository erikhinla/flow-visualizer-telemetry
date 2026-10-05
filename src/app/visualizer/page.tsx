import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { VisualizerExperience } from '../../components/VisualizerExperience';

export const metadata: Metadata = {
  title: 'Trace — PROOF',
  description:
    'Where the project is, what needs done, who has it, and by when — then the keystones that put those facts back.',
};

export default function VisualizerPage() {
  return (
    <Suspense
      fallback={
        <p className="note">
          Opening the Trace… JavaScript is required. <Link href="/">Back home</Link>
        </p>
      }
    >
      <VisualizerExperience />
    </Suspense>
  );
}
