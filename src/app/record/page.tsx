import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';

export const metadata: Metadata = {
  title: 'Record — PROOF',
  description:
    'The workflow, the reconstruction, the balance of the fix, and the review that stays.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
