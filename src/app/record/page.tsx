import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';

export const metadata: Metadata = {
  title: 'Record — Visualizer',
  description:
    'A readable record of the workflow, the repair, the assumptions, and the next change.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
