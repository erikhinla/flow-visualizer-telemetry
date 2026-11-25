import type { Metadata } from 'next';
import { RecordExperience } from '../../components/RecordExperience';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Record · PROOF',
  description:
    'The problem in this team, the hours the search costs, and who owns the next step.',
};

export default function RecordPage() {
  return <RecordExperience />;
}
