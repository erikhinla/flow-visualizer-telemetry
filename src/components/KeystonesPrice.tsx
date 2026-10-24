'use client';

import { useEffect, useState } from 'react';

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

export function KeystonesPrice({ offer }: { offer: KeystonesOffer | null }) {
  if (!offer) return null;
  if (!offer.intro) return <span className="ks-price"><b>${offer.listPrice}</b>, one time.</span>;
  return (
    <span className="ks-price">
      Intro price <s>${offer.listPrice}</s> <b>${offer.price}</b>, one time. For the first {offer.limit} buyers. ${offer.listPrice} after. {offer.left} of {offer.limit} left.
    </span>
  );
}
