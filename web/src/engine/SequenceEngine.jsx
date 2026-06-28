import { useCallback, useEffect, useRef } from 'react';
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
  StaticFieldSequence,
} from '../components/sequence';

const SEQUENCE_BY_ID = {
  'instant-reset': InstantResetSequence,
  'orienting-anchor': OrientingAnchorSequence,
  'coherence-ripple': CoherenceRippleSequence,
  'vagal-downshift': VagalDownshiftSequence,
  'static-field': StaticFieldSequence,
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

  const isActivePhase =
    phase === SurgePhase.REGULATION ||
    phase === SurgePhase.PAUSED ||
    phase === SurgePhase.COMPLETING;

  const audio = useSequenceAudio({
    variantId: variant.id,
    interactionMode: variant.interactionMode,
    clock,
    isEngaged,
    breathCycle: variant.breathCycle,
    enabled: isActivePhase,
  });

  const audioKillRef = useRef(audio.killAll);
  audioKillRef.current = audio.killAll;

  const handleStarted = useCallback(() => {
    if (phase === SurgePhase.ENTRY) beginRegulation();
  }, [phase, beginRegulation]);

  const handleChangeSequence = useCallback(() => {
    haptics.killAll();
    audio.killAll();
    reset();
  }, [haptics, audio, reset]);

  const handleExit = useCallback(() => {
    haptics.killAll();
    audio.killAll();
    reset();
  }, [haptics, audio, reset]);

  const handleRelease = useCallback(() => {
    haptics.killAll();
    if (variant.interactionMode !== InteractionMode.HOLD) {
      audio.killAll();
    }
    releaseHold();
  }, [haptics, audio, releaseHold, variant.interactionMode]);

  useEffect(() => {
    if (!isActivePhase) return undefined;

    if (variant.interactionMode !== InteractionMode.HOLD) {
      haptics.startProfile(variant.id);
    }

    markTactileAnchorReady(variant.interactionMode);

    return () => {
      haptics.killAll();
      audioKillRef.current();
    };
  }, [isActivePhase, variant.id, variant.interactionMode, haptics]);

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
      onExit={handleExit}
      onChangeSequence={phase === SurgePhase.PAUSED ? handleChangeSequence : undefined}
    />
  );
}
