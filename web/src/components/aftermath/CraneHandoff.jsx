import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchCraneContext } from '../../lib/craneClient';

/**
 * Quiet opt-in to Crane (AI guide). Not an upsell — a available companion.
 * Briefs may refer to this engine as Heron; product name is Crane.
 */
export default function CraneHandoff({ sessionId, brainDumpText }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOpenCrane = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetchCraneContext(sessionId);
    } catch {
      /* Crane works without prefetch */
    }
    navigate('/crane', {
      state: { sessionId, brainDumpText: brainDumpText?.trim() || undefined },
    });
  };

  return (
    <motion.div
      className="rounded-sm border border-white/[0.07] bg-white/[0.02] p-8 md:p-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7fa892]">
        04
      </p>
      <h3 className="font-sans text-xl font-semibold tracking-tight text-[#eef4f0] md:text-2xl">
        Crane
      </h3>
      <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-[#9eb5a8]">
        If you want to talk through what just happened, Crane is here. No feed. No
        performance. A steady presence when you choose it.
      </p>
      <button
        type="button"
        onClick={handleOpenCrane}
        disabled={loading}
        className="mt-8 border border-white/10 px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b8cfc4] transition-colors duration-500 hover:border-[#f5a623]/30 hover:text-[#eef4f0] disabled:opacity-50"
      >
        {loading ? 'Opening...' : 'Talk with Crane'}
      </button>
      <p className="mt-4 font-sans text-[10px] text-[#4a5f54]">
        Optional. Requires a clinical token from your provider.
      </p>
    </motion.div>
  );
}
