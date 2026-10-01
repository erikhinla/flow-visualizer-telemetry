import type { Metadata } from 'next';
import { MapExperience } from '../../components/MapExperience';

export const metadata: Metadata = {
  title: 'Scan — PROOF',
  description:
    'Fifteen questions about how an agency runs campaign work. The reading is an answer profile, not a measurement of the jobs.',
};

export default function MapPage() {
  return <MapExperience />;
}
