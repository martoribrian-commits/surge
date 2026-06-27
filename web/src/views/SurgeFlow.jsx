import { AnimatePresence, motion } from 'framer-motion';
import { SurgeSessionProvider, useSurgeSession } from '../context/SurgeSessionProvider';
import { SurgePhase } from '../state/surgeSessionMachine';
import SurgeView from './SurgeView';
import AftermathView from './AftermathView';

const PAGE_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 1.1, ease: [0.25, 0.1, 0.25, 1] },
};

function SurgeFlowRouter() {
  const { phase } = useSurgeSession();
  const showAftermath = phase === SurgePhase.AFTERMATH;

  return (
    <AnimatePresence mode="wait">
      {showAftermath ? (
        <motion.div key="aftermath" className="min-h-screen" {...PAGE_TRANSITION}>
          <AftermathView />
        </motion.div>
      ) : (
        <motion.div key="surge" className="h-screen w-screen" {...PAGE_TRANSITION}>
          <SurgeView />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MVP user journey root — Entry → Regulation → Aftermath state machine.
 */
export default function SurgeFlow() {
  return (
    <SurgeSessionProvider>
      <SurgeFlowRouter />
    </SurgeSessionProvider>
  );
}
