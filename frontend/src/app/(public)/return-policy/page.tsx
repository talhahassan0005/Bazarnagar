import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Return & Refund Policy · ${SITE_NAME}`,
  description: `Return and refund policy for ${SITE_NAME}.`,
};

export default function ReturnPolicyPage() {
  return (
    <LegalPage
      title="Return & Refund Policy"
      intro={`${SITE_NAME} is an online storefront platform connecting customers with independent store owners. All return and refund decisions are handled by the respective store owner, subject to applicable consumer protection laws.`}
      icon="file"
    >
      <h2>1. Overview</h2>
      <p>
        {SITE_NAME} does not directly manufacture, sell, supply, or deliver products listed by independent store owners.
        <strong> All product return and refund decisions are handled by the respective store owner.</strong>
      </p>

      <h2>2. Independent Store Owner Policies</h2>
      <p>Each store owner is responsible for establishing and clearly communicating their own return and refund policy, including:</p>
      <ul>
        <li>Eligibility for returns or exchanges.</li>
        <li>Return request deadlines.</li>
        <li>Product condition requirements.</li>
        <li>Refund procedures and timelines.</li>
        <li>Return shipping costs.</li>
        <li>Non-returnable product categories.</li>
      </ul>

      <h2>3. {SITE_NAME}&apos;s Role</h2>
      <p>{SITE_NAME} does not:</p>
      <ul>
        <li>Collect returned products.</li>
        <li>Issue refunds on behalf of independent sellers.</li>
        <li>Guarantee the acceptance of a return request.</li>
        <li>Guarantee reimbursement for defective, incorrect, or undelivered products.</li>
        <li>Act as a payment intermediary for independent seller transactions unless expressly stated.</li>
      </ul>
      <p>Customers should contact the relevant store owner directly regarding returns, refunds, or exchanges.</p>

      <h2>4. Disputes With Store Owners</h2>
      <p>
        Any dispute regarding a product&apos;s quality, description, condition, delivery, return, or refund should initially be addressed directly with the relevant store owner. {SITE_NAME} may receive reports of suspected fraud or policy violations and take appropriate platform-level action.
      </p>

      <h2>5. Consumer Protection Rights</h2>
      <p>
        Nothing in this Policy removes or limits any mandatory refund, replacement, compensation, or other rights available under applicable consumer protection laws.
      </p>

      <h2>6. Advance Payment Warning</h2>
      <p>
        <strong>{SITE_NAME} strongly recommends Cash on Delivery (COD) for purchases from independent store owners.</strong> Customers should avoid making advance payments directly to sellers. To the extent permitted by applicable law, {SITE_NAME} is not responsible for financial losses resulting from advance payments to independent store owners.
      </p>

      <h2>7. Contact</h2>
      <p>
        For platform-related concerns or to report a potentially fraudulent store, email us at{" "}
        <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
