import WALKTHROUGH from '../../keystones/walkthrough.json';

/** BACK walkthrough video link. Set in keystones/walkthrough.json. Empty hides every video line. */
export const BACK_WALKTHROUGH_URL: string = /^https:\/\/\S+$/.test((WALKTHROUGH.url ?? '').trim()) ? WALKTHROUGH.url.trim() : '';
