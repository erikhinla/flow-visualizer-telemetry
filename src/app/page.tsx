import { ProofFlow } from '../components/ProofFlow';


/** Render on each request so a deploy shows up at once; the year-long page cache kept old builds live. */
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <ProofFlow />;
}
