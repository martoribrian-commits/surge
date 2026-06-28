import { Link } from 'react-router-dom';
import {
  LegalLayout,
  LegalSection,
  LegalParagraph,
  LegalList,
} from '../components/legal';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" eyebrow="Sovereignty Tech">
      <LegalSection label="01" title="How we think about your data">
        <LegalParagraph>
          Surge is built on sovereignty tech: you stay in control of what lives on your device,
          what expires, and what leaves. We do not treat your nervous system moments as marketing
          fuel or analytics inventory.
        </LegalParagraph>
        <LegalParagraph>
          This policy describes what Surge stores locally, what may transit our servers during
          optional clinical features, and what we deliberately do not do.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="02" title="Zero third-party tracking">
        <LegalParagraph>
          We do not sell your data. We do not share your personal information with advertisers,
          data brokers, or social platforms. Surge does not embed third-party analytics pixels,
          behavioral ad networks, or cross-site tracking scripts in the core experience.
        </LegalParagraph>
        <LegalList
          items={[
            'No sale of personal data to third parties.',
            'No behavioral profiling for advertising.',
            'No hidden trackers in the somatic engine or Crane interface.',
          ]}
        />
      </LegalSection>

      <LegalSection label="03" title="Ephemeral AI memory">
        <LegalParagraph>
          Text you enter into Crane, our post-sequence AI guide, is ephemeral by default. Unless
          you explicitly choose to save insights locally, conversation content is stored on your
          device with a 24-hour expiration timestamp and is automatically deleted when that window
          closes.
        </LegalParagraph>
        <LegalParagraph>
          Crane responses generated during an active session follow the same retention rules you
          select. Nothing in Crane is designed to build a permanent profile of you over time.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="04" title="Local storage control">
        <LegalParagraph>
          You may toggle Save insights locally in the Crane decompression view. When enabled,
          conversation text is written to persistent storage on your device only so you can review
          it in future sessions. When disabled, data remains short-lived and expires automatically.
        </LegalParagraph>
        <LegalParagraph>
          No remote database synchronization occurs for Crane conversation content without your
          explicit, active opt-in. Session telemetry for clinical token holders may transmit
          de-identified completion signals to your provider infrastructure. It does not include
          Crane transcript text unless you choose to share it elsewhere.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="05" title="Clinical tokens and providers">
        <LegalParagraph>
          If you enter a clinical token from your provider, Surge validates that token against
          our server. Validation returns valid or invalid. It does not transmit your name, Crane
          messages, or brain-dump content at the point of access.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="06" title="Questions">
        <LegalParagraph>
          For privacy questions, contact us through the{' '}
          <Link to="/support" className="text-[#B6502E] underline-offset-2 hover:underline">
            support portal
          </Link>
          . We respond in plain language.
        </LegalParagraph>
      </LegalSection>
    </LegalLayout>
  );
}
