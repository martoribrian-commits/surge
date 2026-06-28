import {
  LegalLayout,
  LegalSection,
  LegalParagraph,
  LegalList,
  MedicalDisclaimer,
} from '../components/legal';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Medical Disclaimer" eyebrow="Legal">
      <LegalSection label="Overview" title="Agreement">
        <LegalParagraph>
          By using Surge, you agree to these terms. If you do not agree, do not use the product.
          We write this plainly so you can decide with clarity, not after wading through noise.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="Medical" title="Medical disclaimer">
        <MedicalDisclaimer>
          Surge is a secular wellness utility and a somatic regulation tool. It is not a medical
          device, a crisis hotline, or a substitute for professional clinical therapy, psychiatric
          care, or medical diagnosis.
        </MedicalDisclaimer>
        <LegalParagraph>
          If you are in immediate danger or considering harm to yourself or others, contact
          emergency services or a crisis line in your region. Surge is not equipped for emergency
          intervention.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="Service" title="Nature of the service">
        <LegalParagraph>
          Surge offers voluntary somatic sequences designed to support nervous system regulation
          in acute moments. Three durations are available:
        </LegalParagraph>
        <LegalList
          items={[
            '30 seconds — Instant Reset (physiological sigh pattern)',
            '60 seconds — Orienting Anchor (bilateral grounding)',
            '90 seconds — Coherence Ripple (press-and-hold resonant breathing)',
          ]}
        />
        <LegalParagraph>
          Participation is always voluntary. You may pause, release, or exit at any time. No
          sequence adapts to gamify your behavior or penalize interruption.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="Responsibilities" title="Your responsibilities">
        <LegalList
          items={[
            'Use Surge as a regulation utility, not as diagnosis or treatment.',
            'Seek qualified clinical care for ongoing mental health needs.',
            'Do not use Surge while operating vehicles or machinery if visuals or audio impair focus.',
            'Keep clinical tokens confidential if your provider issued one to you.',
          ]}
        />
      </LegalSection>

      <LegalSection label="Liability" title="Limitation of liability">
        <LegalParagraph>
          Surge is provided as is, without warranties of any kind, express or implied. Martori
          Studio and its affiliates are not liable for indirect, incidental, or consequential
          damages arising from use of the product, to the fullest extent permitted by law.
        </LegalParagraph>
        <LegalParagraph>
          You assume responsibility for how and when you use Surge. Our liability for any claim
          related to the service is limited to the amount you paid for access in the twelve months
          preceding the claim, or zero if you accessed Surge without charge.
        </LegalParagraph>
      </LegalSection>

      <LegalSection label="Changes" title="Updates to these terms">
        <LegalParagraph>
          We may revise these terms as the product evolves. Material changes will be reflected on
          this page with an updated date. Continued use after changes constitutes acceptance.
        </LegalParagraph>
      </LegalSection>
    </LegalLayout>
  );
}
