import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';

export const metadata: Metadata = {
  title: 'Record — PROOF',
  description: 'The four facts, the keystone path, the reconstruction, and the review that stays.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
