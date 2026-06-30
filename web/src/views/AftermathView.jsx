import { motion } from 'framer-motion';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import PostSequenceFunnel from '../components/aftermath/PostSequenceFunnel';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { BRAND } from '../brand/tokens';

/**
 * Post-sequence aftermath — unified visual funnel into Crane decompression.
 */
export default function AftermathView() {
  const { enterDecompression } = useSequenceSession();

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden"
      style={{ background: BRAND.void, color: BRAND.bone }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <FilmGrainOverlay />
      <PostSequenceFunnel onEnterCrane={enterDecompression} />
    </motion.div>
  );
}
