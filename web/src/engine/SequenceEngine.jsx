import { useCallback } from 'react';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { SurgePhase } from '../state/surgeSessionMachine';
import {
  InstantResetSequence,
  OrientingAnchorSequence,
  CoherenceRippleSequence,
} from '../components/sequence';

const SEQUENCE_BY_ID = {
  'instant-reset': InstantResetSequence,
  'orienting-anchor': OrientingAnchorSequence,
  'coherence-ripple': CoherenceRippleSequence,
};

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

  const handleStarted = useCallback(() => {
    if (phase === SurgePhase.ENTRY) beginRegulation();
  }, [phase, beginRegulation]);

  const handleChangeSequence = useCallback(() => {
    reset();
  }, [reset]);

  const isActivePhase =
    phase === SurgePhase.REGULATION ||
    phase === SurgePhase.PAUSED ||
    phase === SurgePhase.COMPLETING;

  if (!isActivePhase) return null;

  const SequenceComponent = SEQUENCE_BY_ID[variant.id] ?? CoherenceRippleSequence;

  return (
    <SequenceComponent
      variant={variant}
      clock={clock}
      haptics={haptics}
      isEngaged={isEngaged}
      onEngage={engageHold}
      onRelease={releaseHold}
      onStarted={handleStarted}
      onChangeSequence={phase === SurgePhase.PAUSED ? handleChangeSequence : undefined}
    />
  );
}
