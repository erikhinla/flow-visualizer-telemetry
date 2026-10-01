import type { Metadata } from 'next';
import { MapExperience } from '../../components/MapExperience';

export const metadata: Metadata = {
  title: 'Momentum Map — Visualizer',
  description:
    'Fifteen questions about how work runs. The reading is an answer profile, not a measurement.',
};

export default function MapPage() {
  return <MapExperience />;
}
