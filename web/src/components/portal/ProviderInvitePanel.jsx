import { useCallback, useEffect, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { fetchPortalInvites, sendPortalInvite, revokePortalInvite } from '../../lib/portalClient';

export default function ProviderInvitePanel({ accessToken, isAdmin }) {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadInvites = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalInvites(accessToken);
      setInvites(data.invites ?? []);
    } catch {
      setError('Could not load invites.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken || sending || !email.trim()) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      await sendPortalInvite(accessToken, { email: email.trim(), role });
      setEmail('');
      setSuccess('Invite sent. They will receive an email to join your organization.');
      await loadInvites();
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Invite failed.' : (err.message || 'Invite failed.'));
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (inviteId) => {
    if (!accessToken) return;
    try {
      await revokePortalInvite(accessToken, inviteId);
      await loadInvites();
    } catch {
      setError('Could not revoke invite.');
    }
  };

  return (
    <section className="mt-6 rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
        Invite clinician
      </h3>
      <p className="mt-2 font-sans text-[11px] leading-relaxed" style={{ color: BRAND.boneDim }}>
        Send an email invite for another clinician to join your organization portal.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none focus:border-[#B6502E]/50"
            placeholder="clinician@practice.com"
          />
        </label>
        <label className="sm:w-36">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
            Role
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={sending}
          className="border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors hover:brightness-110 disabled:opacity-40"
          style={{ color: BRAND.bone, borderColor: `${BRAND.clay}55`, background: `${BRAND.clay}14` }}
        >
          {sending ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      {error ? (
        <p className="mt-3 font-sans text-xs" style={{ color: BRAND.clay }}>
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 font-sans text-xs" style={{ color: '#8FB596' }}>
          {success}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
          Loading pending invites…
        </p>
      ) : invites.length ? (
        <ul className="mt-4 space-y-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-white/[0.06] px-3 py-2"
            >
              <div>
                <p className="font-sans text-xs" style={{ color: BRAND.boneMuted }}>
                  {invite.email}
                </p>
                <p className="font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
                  {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(invite.id)}
                className="font-sans text-[9px] uppercase tracking-[0.14em] underline"
                style={{ color: BRAND.boneDim }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
          No pending invites.
        </p>
      )}
    </section>
  );
}
