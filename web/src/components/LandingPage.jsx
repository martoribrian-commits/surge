import DecelerationHero from './landing/DecelerationHero';
import TactileAnchorSection from './landing/TactileAnchorSection';
import PostSurgeActions from './landing/PostSurgeActions';
import LandingFooter from './landing/LandingFooter';

/**
 * Surge marketing landing — Slow Tech / Sovereignty Tech.
 * Modular sections; wire individual imports into other layouts as needed.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <DecelerationHero />
      <TactileAnchorSection />
      <PostSurgeActions />
      <LandingFooter />
    </div>
  );
}
