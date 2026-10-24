import type { Metadata } from 'next';
import { KeystonesIntake } from '../../components/KeystonesIntake';
import './keystones.css';

export const metadata: Metadata = {
  title: 'Context Keystones intake · PROOF',
  description: 'The PROOF answers carry over. A few more questions build the agency its own Context Keystones pack.',
};

export default function KeystonesPage() {
  return <KeystonesIntake />;
}
