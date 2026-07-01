import { useCallback, useEffect, useRef } from 'react';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useSequenceAudio } from '../hooks/useSequenceAudio';
import { SurgePhase } from '../state/surgeSessionMachine';
import { InteractionMode } from '../sequences';
import { markTactileAnchorReady } from '../lib/performanceMetrics';
import {
  InstantResetSequence,
  FlashFreezeSequence,
  OrientingAnchorSequence,
  NovaGateSequence,
  StillThawSequence,
  CoherenceRippleSequence,
  HeavyTideSequence,
  VagalDownshiftSequence,
  StaticFieldSequence,
  DeepAnchorSequence,
} from '../components/sequence';
import CustomSequence from '../components/sequence/CustomSequence';
import { isCustomVariantId } from '../sequences';

const SEQUENCE_BY_ID = {
  'instant-reset': InstantResetSequence,
  'flash-freeze': FlashFreezeSequence,
  'orienting-anchor': OrientingAnchorSequence,
  'nova-gate': NovaGateSequence,
  'still-thaw': StillThawSequence,
  'coherence-ripple': CoherenceRippleSequence,
  'heavy-tide': HeavyTideSequence,
  'vagal-downshift': VagalDownshiftSequence,
  'static-field': StaticFieldSequence,
  'deep-anchor': DeepAnchorSequence,
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
    customAudioProfile: variant.isCustom ? variant.audioProfile : null,
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
    reset({ recordInterrupted: true });
  }, [haptics, audio, reset]);

  const handleExit = useCallback(() => {
    haptics.killAll();
    audio.killAll();
    reset({ recordInterrupted: true });
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
      haptics.startProfile(variant.isCustom ? 'custom-sequence' : variant.id);
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
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleExit();
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [haptics, audio, handleExit]);

  if (!isActivePhase) return null;

  if (isCustomVariantId(variant.id) || variant.isCustom) {
    return (
      <CustomSequence
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
