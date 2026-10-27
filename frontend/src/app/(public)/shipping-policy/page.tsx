import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Shipping Policy · ${SITE_NAME}`,
  description: `Shipping policy for ${SITE_NAME}.`,
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      intro={`${SITE_NAME} provides online storefront and product discovery services to independent businesses. ${SITE_NAME} does not provide shipping, courier, logistics, order fulfillment, or delivery services for products offered by independent store owners.`}
      icon="file"
    >
      <h2>1. Overview</h2>
      <p>
        All shipping arrangements are managed independently by the relevant seller.
      </p>

      <h2>2. Store Owner Responsibilities</h2>
      <p>Each store owner is solely responsible for:</p>
      <ul>
        <li>Confirming product availability.</li>
        <li>Packaging and preparing orders.</li>
        <li>Selecting delivery providers.</li>
        <li>Determining shipping fees.</li>
        <li>Establishing delivery locations and service areas.</li>
        <li>Communicating expected delivery times.</li>
        <li>Dispatching products to customers.</li>
        <li>Handling lost, delayed, damaged, or undelivered shipments.</li>
        <li>Resolving shipping complaints.</li>
      </ul>

      <h2>3. Shipping Fees and Delivery Time</h2>
      <p>
        Shipping fees, estimated delivery dates, and delivery availability vary between independent stores. {SITE_NAME} does not establish shipping charges or guarantee delivery timeframes for third-party products. Customers should confirm delivery costs, shipping methods, and estimated delivery dates directly with the store owner.
      </p>

      <h2>4. Failed, Delayed, or Damaged Deliveries</h2>
      <p>{SITE_NAME} does not control the shipping or delivery process. To the maximum extent permitted by applicable law, {SITE_NAME} is not responsible for:</p>
      <ul>
        <li>Delayed shipments.</li>
        <li>Lost or stolen packages.</li>
        <li>Damaged products.</li>
        <li>Incorrect or incomplete deliveries.</li>
        <li>Failed delivery attempts.</li>
        <li>Courier-related disputes.</li>
      </ul>
      <p>Customers should contact the relevant store owner to resolve these matters.</p>

      <h2>5. Cash on Delivery Recommendation</h2>
      <p>
        For customer protection, {SITE_NAME} strongly advises buyers to choose <strong>Cash on Delivery (COD)</strong> whenever available. Buyers are advised not to make advance payments directly to independent store owners.
      </p>

      <h2>6. Delivery Disputes</h2>
      <p>
        Any dispute regarding delivery, shipping charges, package condition, or fulfillment is primarily a matter between the buyer, store owner, and relevant delivery provider. {SITE_NAME} is not obligated to arrange replacement deliveries, reimburse shipping costs, or compensate customers for independent seller delivery failures, except where required by applicable law.
      </p>

      <h2>7. Contact</h2>
      <p>
        For platform-related inquiries, email us at{" "}
        <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
