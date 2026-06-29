import { useEffect } from 'react';
import { useSequenceSession } from '../../context/SequenceSessionProvider';
import { useCraneOptional } from '../../context/CraneProvider';

/** Syncs sequence phase into CraneProvider so Fab hides during in-flow decompression. */
export default function SequenceCraneBridge() {
  const { phase } = useSequenceSession();
  const crane = useCraneOptional();

  useEffect(() => {
    crane?.setSequencePhase(phase);
    return () => crane?.setSequencePhase(null);
  }, [phase, crane]);

  return null;
}
