/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { flushEphemeralNote } from './EphemeralInput';
import { loadEphemeralNote, saveEphemeralNote } from '../../lib/ephemeralStore';

describe('EphemeralInput flushEphemeralNote', () => {
  it('persists text immediately for handoff', () => {
    const sessionId = 'test-session-flush';
    saveEphemeralNote(sessionId, '');
    const text = 'still feeling wired';
    flushEphemeralNote(sessionId, text);
    expect(loadEphemeralNote(sessionId)).toBe(text);
  });
});
