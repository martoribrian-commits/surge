import { AnimatePresence, motion } from 'framer-motion';
import { SequenceSessionProvider, useSequenceSession } from '../context/SequenceSessionProvider';
import { SurgePhase } from '../state/surgeSessionMachine';
import { resolveVariantId } from '../sequences';
import SequenceEngine from '../engine/SequenceEngine';
import SequenceEntryView from './SequenceEntryView';
import AftermathView from './AftermathView';
import DecompressionView from './DecompressionView';

const PAGE_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
};

function SequenceFlowRouter() {
  const { phase } = useSequenceSession();

  const showEntry = phase === SurgePhase.ENTRY;
  const showEngine =
    phase === SurgePhase.REGULATION ||
    phase === SurgePhase.PAUSED ||
    phase === SurgePhase.COMPLETING;
  const showAftermath = phase === SurgePhase.AFTERMATH;
  const showDecompression = phase === SurgePhase.DECOMPRESSION;

  return (
    <AnimatePresence mode="popLayout">
      {showDecompression ? (
        <motion.div key="decompression" className="fixed inset-0 z-40 h-screen w-screen" {...PAGE_TRANSITION}>
          <DecompressionView />
        </motion.div>
      ) : showAftermath ? (
        <motion.div key="aftermath" className="min-h-screen" {...PAGE_TRANSITION}>
          <AftermathView />
        </motion.div>
      ) : showEngine ? (
        <div key="engine" className="fixed inset-0 z-40 h-screen w-screen">
          <SequenceEngine />
        </div>
      ) : showEntry ? (
        <motion.div key="entry" className="min-h-screen" {...PAGE_TRANSITION}>
          <SequenceEntryView />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Release 1.33 flow — Entry (picker) → SequenceEngine → AftermathView (Crane handoff).
 *
 * @param {{ initialVariantId?: string }} props
 */
export default function SequenceFlow({ initialVariantId = null }) {
  return (
    <SequenceSessionProvider initialVariantId={resolveVariantId(initialVariantId)}>
      <SequenceFlowRouter />
    </SequenceSessionProvider>
  );
}
