import { LegalLayout, LegalParagraph } from '../components/legal';
import { SupportAccordion, SupportContactForm } from '../components/support';

export default function SupportPage() {
  return (
    <LegalLayout title="Support" eyebrow="Help">
      <LegalParagraph>
        Direct answers for common questions. No chatbot. No ticket maze. If you need a human,
        use the form below.
      </LegalParagraph>

      <div className="mt-12">
        <SupportAccordion />
      </div>

      <SupportContactForm />
    </LegalLayout>
  );
}
