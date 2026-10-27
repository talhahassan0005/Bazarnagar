import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Cancellation Policy · ${SITE_NAME}`,
  description: `Cancellation policy for ${SITE_NAME}.`,
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      intro={`${SITE_NAME} is an online storefront creation and product discovery platform. All product orders and purchasing arrangements are managed independently by individual store owners.`}
      icon="file"
    >
      <h2>1. Overview</h2>
      <p>
        <strong>{SITE_NAME} does not control, approve, reject, or guarantee the fulfillment of orders placed with independent store owners.</strong>
      </p>

      <h2>2. Cancellation by Store Owners</h2>
      <p>Store owners may cancel orders at any stage of order processing. Possible reasons include:</p>
      <ul>
        <li>Product unavailability.</li>
        <li>Inventory or pricing errors.</li>
        <li>Delivery restrictions.</li>
        <li>Inability to fulfill an order.</li>
        <li>Suspected fraudulent activity.</li>
        <li>Other operational or business considerations.</li>
      </ul>
      <p>Store owners are responsible for communicating cancellations to affected customers and fulfilling any resulting legal obligations, including applicable refunds.</p>

      <h2>3. Cancellation by Customers</h2>
      <p>
        Customers wishing to cancel an order must contact the respective store owner directly. Cancellation eligibility depends on the seller&apos;s policies, the status of the order, and applicable law. {SITE_NAME} does not guarantee that a store owner will accept a cancellation request.
      </p>

      <h2>4. Payments and Cancellations</h2>
      <p>
        {SITE_NAME} strongly advises customers to use <strong>Cash on Delivery (COD)</strong> and avoid advance payments to independent sellers. If a customer has already paid an independent store owner, any applicable reimbursement remains the responsibility of that seller. {SITE_NAME} does not administer or guarantee such reimbursements.
      </p>

      <h2>5. {SITE_NAME}&apos;s Liability</h2>
      <p>To the maximum extent permitted by applicable law, {SITE_NAME} is not liable for losses arising from an independent store owner&apos;s cancellation, including:</p>
      <ul>
        <li>Cancelled or rejected orders.</li>
        <li>Refusal to fulfill an order.</li>
        <li>Disagreements over cancellation charges.</li>
        <li>Failure to refund advance payments.</li>
        <li>Delays or inconvenience caused by cancellation.</li>
      </ul>

      <h2>6. Customer Safety Notice</h2>
      <p>
        <strong>For your safety, always prefer Cash on Delivery. Do not pay sellers in advance.</strong> {SITE_NAME} cannot guarantee the legitimacy, reliability, or fulfillment of transactions conducted between customers and independent store owners.
      </p>

      <h2>7. Contact</h2>
      <p>
        For platform-related concerns, email us at{" "}
        <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
