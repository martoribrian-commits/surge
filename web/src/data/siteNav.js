export const PRIMARY_NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/for-providers', label: 'Providers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/start', label: 'Start' },
];

export const SECONDARY_NAV = [
  { href: '/clinical-token', label: 'Token' },
  { href: '/support', label: 'Support' },
];

export const FOOTER_LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

/** @param {string} pathname @param {string} href */
export function isNavActive(pathname, href) {
  if (href === '/start') {
    return pathname === '/start' || pathname.startsWith('/engine');
  }
  return pathname === href;
}

export const ALL_HEADER_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
