/**
 * Line-break tidy for browsers without text-wrap: pretty (Safari before 26).
 * Glues short words and numbers to the next word, and the last two words of a block,
 * so no line ends on a/the/of/and and no word sits alone on the last line.
 */
const GLUE = /(^|[\s(])(a|an|the|of|and|or|to|by|for|on|in|at|plus|then|\$[\d,.]+) (?=\S)/gi;
const BLOCKS = 'p,li,h1,h2,h3,label > span,.px-option span,small';

function fixText(n: Text, last: boolean): void {
  const t = n.nodeValue ?? '';
  let v = t.replace(GLUE, (_m, a: string, b: string) => `${a}${b}\u00a0`).replace(GLUE, (_m, a: string, b: string) => `${a}${b}\u00a0`);
  if (last) {
    const trimmed = v.replace(/\s+$/, '');
    // Glue only the final gap, once. Re-runs (the observer fires on every re-render) must not walk back
    // through the line turning every space into a no-break space, which made text run off narrow screens.
    const i = Math.max(trimmed.lastIndexOf(' '), trimmed.lastIndexOf('\u00a0'));
    if (i > 0 && trimmed[i] === ' ' && trimmed.split(/\s+/).length >= 3) v = `${v.slice(0, i)}\u00a0${v.slice(i + 1)}`;
  }
  if (v !== t) n.nodeValue = v;
}

export function tidyBlock(el: Element): void {
  if (el.closest('input,textarea,script,style,.px-sr')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) if ((n.nodeValue ?? '').trim()) nodes.push(n as Text);
  const words = (el.textContent ?? '').trim().split(/\s+/).length;
  nodes.forEach((t, i) => fixText(t, i === nodes.length - 1 && words >= 4));
}

export function tidyAll(root: Element): void {
  root.querySelectorAll(BLOCKS).forEach(tidyBlock);
}
