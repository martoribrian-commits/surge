import { describe, expect, it } from 'vitest';
import { buildVectorSnapshotPayload } from './vectorSnapshot';

describe('buildVectorSnapshotPayload', () => {
  it('returns null without sessionId or summary', () => {
    expect(buildVectorSnapshotPayload({}, {})).toBeNull();
    expect(
      buildVectorSnapshotPayload(
        { bodyInsight: { autonomicRead: 'calm' } },
        { sessionId: '00000000-0000-4000-8000-000000000001' },
      ),
    ).toBeTruthy();
  });

  it('prefers post-session debrief summary', () => {
    const payload = buildVectorSnapshotPayload(
      {
        bodyInsight: {
          type: 'post-session-debrief',
          debriefSummary: 'Parasympathetic rebound after vagal work.',
          completedVariantId: 'vagal-downshift',
        },
        carePlan: { clinicalNote: 'ignored' },
      },
      { sessionId: '00000000-0000-4000-8000-000000000001' },
    );

    expect(payload.summary).toContain('Parasympathetic');
    expect(payload.metadata.variantId).toBe('vagal-downshift');
    expect(payload.metadata.type).toBe('post-session-debrief');
  });

  it('truncates long summaries', () => {
    const long = 'x'.repeat(700);
    const payload = buildVectorSnapshotPayload(
      { bodyInsight: { autonomicRead: long } },
      { sessionId: '00000000-0000-4000-8000-000000000001' },
    );
    expect(payload.summary.length).toBeLessThanOrEqual(600);
  });

  it('rejects invalid variant ids in metadata', () => {
    const payload = buildVectorSnapshotPayload(
      { bodyInsight: { autonomicRead: 'read' }, variantId: 'not-real' },
      { sessionId: '00000000-0000-4000-8000-000000000001', variantId: 'also-bad' },
    );
    expect(payload.metadata.variantId).toBeNull();
  });
});
