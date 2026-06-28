import { useCallback, useEffect } from 'react';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useSequenceAudio } from '../hooks/useSequenceAudio';
import { SurgePhase } from '../state/surgeSessionMachine';
import { InteractionMode } from '../sequences';
import { markTactileAnchorReady } from '../lib/performanceMetrics';
import {
  InstantResetSequence,
  OrientingAnchorSequence,
  CoherenceRippleSequence,
  VagalDownshiftSequence,
} from '../components/sequence';

const SEQUENCE_BY_ID = {
  'instant-reset': InstantResetSequence,
  'orienting-anchor': OrientingAnchorSequence,
  'coherence-ripple': CoherenceRippleSequence,
  'vagal-downshift': VagalDownshiftSequence,
};

/**
 * Release 1.33 sequence orchestrator.
 * Wires native haptic/audio bridges and guarantees sensory cleanup on exit.
 */
export default function SequenceEngine() {
  const {
    phase,
    variant,
    clock,
    haptics,
    isEngaged,
    beginRegulation,
    engageHold,
    releaseHold,
    reset,
  } = useSequenceSession();

  const audio = useSequenceAudio();

  const handleStarted = useCallback(() => {
    if (phase === SurgePhase.ENTRY) beginRegulation();
  }, [phase, beginRegulation]);

  const handleChangeSequence = useCallback(() => {
    haptics.killAll();
    audio.killAll();
    reset();
  }, [haptics, audio, reset]);

  const handleRelease = useCallback(() => {
    haptics.killAll();
    audio.killAll();
    releaseHold();
  }, [haptics, audio, releaseHold]);

  const isActivePhase =
    phase === SurgePhase.REGULATION ||
    phase === SurgePhase.PAUSED ||
    phase === SurgePhase.COMPLETING;

  useEffect(() => {
    if (!isActivePhase) return undefined;

    audio.prime();

    if (variant.interactionMode !== InteractionMode.HOLD) {
      haptics.startProfile(variant.id);
      if (variant.id === 'instant-reset') {
        audio.playPhysiologicalSigh();
      }
    }

    markTactileAnchorReady(variant.interactionMode);

    return () => {
      haptics.killAll();
      audio.killAll();
    };
  }, [isActivePhase, variant.id, variant.interactionMode, haptics, audio]);

  useEffect(() => {
    const onPageHide = () => {
      haptics.killAll();
      audio.killAll();
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [haptics, audio]);

  if (!isActivePhase) return null;

  const SequenceComponent = SEQUENCE_BY_ID[variant.id] ?? CoherenceRippleSequence;

  return (
    <SequenceComponent
      variant={variant}
      clock={clock}
      haptics={haptics}
      audio={audio}
      isEngaged={isEngaged}
      onEngage={engageHold}
      onRelease={handleRelease}
      onStarted={handleStarted}
      onChangeSequence={phase === SurgePhase.PAUSED ? handleChangeSequence : undefined}
    />
  );
}
