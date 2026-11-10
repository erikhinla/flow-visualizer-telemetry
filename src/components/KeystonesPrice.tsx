'use client';

import { useEffect, useState } from 'react';
import { BACK_INTRO_PRICE, BACK_LIST_PRICE } from '../lib/keystones-prices';

export interface KeystonesOffer { intro: boolean; left: number; limit: number; price: number; listPrice: number }
const base = process.env.NEXT_PUBLIC_PROOF_BASE_PATH ?? '';

/** The live price. Until it loads, nothing about a count is shown. */
export function useKeystonesOffer(): KeystonesOffer | null {
  const [o, setO] = useState<KeystonesOffer | null>(null);
  useEffect(() => {
    fetch(`${base}/api/keystones/offer`, { cache: 'no-store' }).then((r) => r.json()).then((v: KeystonesOffer) => { if (typeof v.price === 'number') setO(v); }).catch(() => undefined);
  }, []);
  return o;
}

export const checkoutHref = (code?: string | null) => `${base}/api/keystones/checkout${code ? `?ref=${code}` : ''}`;

/** BACK prices shown on screen, from the same constants the server offer uses. */
export { BACK_INTRO_PRICE, BACK_LIST_PRICE };
export const backFootnote = (limit = 50) => `Intro offer: first ${limit} are $${BACK_INTRO_PRICE}. $${BACK_LIST_PRICE} after.`;

export function KeystonesPrice({ offer }: { offer: KeystonesOffer | null }) {
  if (!offer) return null;
  if (!offer.intro) return <span className="ks-price"><b>${BACK_LIST_PRICE}</b>, one time.</span>;
  return (
    <span className="ks-price">
      <s>${BACK_LIST_PRICE}</s> <b>${BACK_INTRO_PRICE}</b>, one time. {backFootnote(offer.limit)}
    </span>
  );
}

/** The BACK price for an offer card: big struck list price and intro price, small footnote under it. */
export function BackCardPrice({ offer }: { offer: KeystonesOffer | null }) {
  const intro = offer ? offer.intro : true;
  return (
    <>
      <p className="px-oc-price">{intro ? <><s>${BACK_LIST_PRICE}</s> <b>${BACK_INTRO_PRICE}</b></> : <b>${BACK_LIST_PRICE}</b>}</p>
      <p className="px-oc-note">{intro ? backFootnote(offer?.limit ?? 50) : 'One time.'}</p>
    </>
  );
}
