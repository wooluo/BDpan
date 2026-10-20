// The two sections L1/R1 move between, and what the header highlights.

import { useNavActions, useNavState } from '../state/nav.jsx';

const KEYS = {
  browser: 'nav:browser',
  downloads: 'nav:downloads',
};
const TABS = ['browser', 'downloads'];

function useSections() {
  const nav = useNavActions();
  const { top } = useNavState();
  const section = top.name === 'downloads' ? 'downloads' : 'browser';
  const on = {
    browser: () => nav.home('nav:browser'),
    downloads: () => top.name !== 'downloads' && nav.push({ name: 'downloads' }, 'nav:downloads'),
  };
  const step = (forward) => {
    const next = TABS[TABS.indexOf(section) + (forward ? 1 : -1)];
    if (next) on[next]();
  };
  return { section, on, step, keyOf: (name) => name === section ? 'nav:current' : KEYS[name] };
}

export { useSections };
