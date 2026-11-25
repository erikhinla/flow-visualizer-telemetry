import type { Metadata } from 'next';
import { KeystonesIntake } from '../../components/KeystonesIntake';
import './keystones.css';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BACK intake · PROOF',
  description: 'The PROOF answers carry over. A few more questions build the agency its own BACK pack.',
};

export default function KeystonesPage() {
  return <KeystonesIntake />;
}
