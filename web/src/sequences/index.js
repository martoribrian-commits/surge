export {
  InteractionMode,
  SEQUENCE_VARIANTS,
  DEFAULT_VARIANT_ID,
  VARIANT_LIST,
  resolveVariantId,
  getVariant,
} from './config';

export {
  CUSTOM_VARIANT_PREFIX,
  isCustomVariantId,
  buildCustomVariant,
  normalizeCustomSpec,
  persistCustomVariant,
  loadPersistedCustomVariant,
  clearPersistedCustomVariant,
  buildFallbackCustomSequence,
  phaseAtElapsed,
} from './customSequence';
