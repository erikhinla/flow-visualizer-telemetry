import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';

export const metadata: Metadata = {
  title: 'Record · PROOF',
  description:
    'The problem on this desk, the hours the search is costing, and the judgment that stays.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
