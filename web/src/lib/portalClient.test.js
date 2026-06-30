import { describe, expect, it } from 'vitest';

// Mirror portal-auth tokenStatus for client label consistency
function tokenStatus(row) {
  if (row.uses_remaining <= 0) return 'revoked';
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'expired';
  if (row.activated_at) return 'activated';
  return 'active';
}

describe('portal token status', () => {
  it('marks zero uses as revoked', () => {
    expect(tokenStatus({ uses_remaining: 0, expires_at: null })).toBe('revoked');
  });

  it('marks future token as active', () => {
    expect(
      tokenStatus({
        uses_remaining: 3,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        activated_at: null,
      }),
    ).toBe('active');
  });
});
