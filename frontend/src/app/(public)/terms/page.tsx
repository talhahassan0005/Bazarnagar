import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms & Conditions · ${SITE_NAME}`,
  description: `The terms that govern your use of ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={`Welcome to ${SITE_NAME}. By accessing or using ${SITE_NAME}, you agree to these Terms & Conditions and our Privacy Policy.`}
      icon="file"
    >
      <h2>1. Introduction</h2>
      <p>
        {SITE_NAME} is an online platform that enables individuals, small businesses, and independent sellers to create online storefronts, display products, share store links, and connect with potential customers.
      </p>

      <h2>2. Nature of Our Services</h2>
      <p>
        {SITE_NAME} provides digital storefront creation, product listing, business discovery, and related technology services.
      </p>
      <p>
        <strong>{SITE_NAME} is not the seller, manufacturer, supplier, shipping provider, or merchant of record for products offered by independent store owners.</strong>
      </p>
      <p>
        Unless explicitly stated otherwise, all transactions involving products listed by store owners are conducted directly between the buyer and the respective store owner. {SITE_NAME} does not guarantee the identity, legitimacy, reliability, product quality, availability, or performance of any independent seller.
      </p>

      <h2>3. Store Owner Responsibilities</h2>
      <p>Every store owner is independently responsible for:</p>
      <ul>
        <li>Providing accurate product descriptions, photographs, prices, and availability.</li>
        <li>Managing customer inquiries and purchase requests.</li>
        <li>Processing and fulfilling customer orders.</li>
        <li>Arranging packaging, shipping, and delivery.</li>
        <li>Establishing and disclosing cancellation, return, and refund terms.</li>
        <li>Handling customer complaints and disputes.</li>
        <li>Complying with applicable consumer protection, taxation, intellectual property, and business laws.</li>
        <li>Maintaining accurate business identity and contact information.</li>
      </ul>
      <p>Store owners must not publish fraudulent, misleading, illegal, counterfeit, prohibited, or otherwise unauthorized products or content.</p>

      <h2>4. Orders and Transactions</h2>
      <p>
        Any order, purchase agreement, or other transaction between a buyer and an independent store owner is the responsibility of those parties. Unless {SITE_NAME} expressly offers a separate transaction or payment service, {SITE_NAME} does not receive, hold, process, guarantee, or refund payments made to independent sellers.
      </p>

      <h2>5. Payment Safety</h2>
      <p><strong>IMPORTANT CUSTOMER SAFETY NOTICE</strong></p>
      <p>{SITE_NAME} strongly advises customers to:</p>
      <ul>
        <li>Always choose Cash on Delivery (COD) where available.</li>
        <li>Avoid making advance payments to store owners.</li>
        <li>Verify the seller&apos;s identity, product details, and delivery arrangements before placing an order.</li>
        <li>Avoid transferring money to personal bank accounts, mobile wallets, or other payment methods before receiving goods.</li>
      </ul>
      <p>Advance payments made directly to independent store owners are at the buyer&apos;s own risk. To the maximum extent permitted by applicable law, {SITE_NAME} is not responsible for advance payment losses, seller fraud, non-delivery, or the failure of a seller to fulfill an order.</p>

      <h2>6. Shipping and Deliveries</h2>
      <p>
        All shipping and delivery arrangements are managed independently by the relevant store owner or their chosen delivery provider. {SITE_NAME} does not operate a courier service or guarantee shipping dates, delivery charges, successful delivery, or the condition of goods upon arrival.
      </p>

      <h2>7. Returns, Refunds, and Cancellations</h2>
      <p>
        {SITE_NAME} does not establish, administer, process, or guarantee a universal return, refund, or cancellation policy for products sold by independent store owners. Each store owner determines and communicates their own policies, subject to applicable law.
      </p>

      <h2>8. Accounts and Store Content</h2>
      <p>
        Users must provide accurate registration information and maintain the confidentiality of their login credentials. By uploading content, store owners grant {SITE_NAME} a non-exclusive, worldwide, royalty-free license to host, reproduce, display, distribute, and promote that content as necessary to operate, advertise, and improve the platform.
      </p>

      <h2>9. Advertising and Data Usage</h2>
      <p>
        {SITE_NAME} may display advertisements, sponsored listings, featured products, and promotional content across its platform. {SITE_NAME} may collect, analyze, and share information with third parties for analytics, platform improvement, advertising, personalization, and other purposes described in our Privacy Policy.
      </p>

      <h2>10. Platform Availability and Changes</h2>
      <p>
        {SITE_NAME} may introduce, modify, restrict, or discontinue features, plans, product limits, or services. We do not guarantee uninterrupted access, error-free operation, specific search rankings, customer traffic, sales, or commercial results.
      </p>

      <h2>11. Suspension or Termination</h2>
      <p>
        {SITE_NAME} reserves the right to remove product listings, restrict accounts, suspend stores, or terminate access where reasonably necessary due to suspected fraud, illegal activity, policy violations, security concerns, or legal requirements.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable law, {SITE_NAME} shall not be liable for losses arising from independent sellers&apos; acts or omissions, including failed or fraudulent transactions, lost advance payments, undelivered or defective products, or disputes between store owners and customers.</p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms shall be governed by the applicable laws of Pakistan. Disputes involving {SITE_NAME} shall be subject to the jurisdiction of competent courts in Pakistan.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        {SITE_NAME} may update these Terms from time to time. Continued use after changes take effect constitutes acceptance to the extent permitted by law.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these terms? Email us at <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
