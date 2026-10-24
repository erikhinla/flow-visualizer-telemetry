import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';

export const metadata: Metadata = {
  title: 'Record · PROOF',
  description:
    'The problem in this team, the hours the search costs, and who owns the next step.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
