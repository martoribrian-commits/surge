import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchPortalSettings,
  updatePortalSettings,
  changePortalPassword,
} from '../../lib/portalClient';
import { BRAND } from '../../brand/tokens';

export default function ProviderSettingsPanel({ accessToken, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalSettings(accessToken);
      setProfile(data.profile);
      setName(data.profile?.name ?? '');
      setOrgName(data.profile?.orgName ?? '');
    } catch {
      setError('Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!accessToken || saving) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = { name: name.trim() };
      if (profile?.isAdmin) payload.orgName = orgName.trim();
      const data = await updatePortalSettings(accessToken, payload);
      setProfile((prev) => ({ ...prev, ...data.profile }));
      setMessage('Profile updated.');
      onProfileUpdated?.(data.profile);
    } catch (err) {
      setError(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!accessToken || changingPassword) return;
    setChangingPassword(true);
    setMessage('');
    setError('');
    try {
      await changePortalPassword(accessToken, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err.message || 'Password change failed.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    await supabase?.auth.signOut();
  };

  if (loading) {
    return (
      <p className="py-12 text-center font-sans text-xs" style={{ color: BRAND.boneDim }}>
        Loading settings…
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
        <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
              Display name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none focus:border-[#B6502E]/50"
            />
          </label>
          {profile?.isAdmin ? (
            <label className="block">
              <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
                Organization name
              </span>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none focus:border-[#B6502E]/50"
              />
            </label>
          ) : (
            <p className="font-sans text-xs" style={{ color: BRAND.boneDim }}>
              Organization: {profile?.orgName ?? '—'}
            </p>
          )}
          <p className="font-sans text-xs" style={{ color: BRAND.boneDim }}>
            Email: {profile?.email ?? '—'}
          </p>
          <p className="font-sans text-xs" style={{ color: BRAND.boneDim }}>
            Role: {profile?.role ?? 'member'} · Tier: {profile?.tier ?? 'standard'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}14` }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
        <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
          Password
        </h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
              Current password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
              New password (8+ characters)
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-sm border border-white/[0.12] bg-black/30 px-3 py-2 font-sans text-sm text-white outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || newPassword.length < 8}
            className="border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}14` }}
          >
            {changingPassword ? 'Updating…' : 'Change password'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <button
            type="button"
            onClick={handleSignOutEverywhere}
            className="font-sans text-[10px] uppercase tracking-[0.16em] underline"
            style={{ color: BRAND.boneDim }}
          >
            Sign out on this device
          </button>
        </div>
      </section>

      {message ? (
        <p className="lg:col-span-2 font-sans text-xs" style={{ color: '#8FB596' }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="lg:col-span-2 font-sans text-xs" style={{ color: BRAND.clay }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
