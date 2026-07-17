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
      intro={`Welcome to ${SITE_NAME}. These terms govern your use of our website and services. By using ${SITE_NAME}, you agree to them.`}
      icon="file"
    >
      <h2>1. About {SITE_NAME}</h2>
      <p>
        {SITE_NAME} is an online marketplace that lets sellers create a mobile-friendly catalog,
        share a public shop link, and take orders — including directly over WhatsApp. We connect
        buyers and independent sellers; we are a platform and are not the seller of the products
        listed by our sellers.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old, or use {SITE_NAME} under the supervision of a parent or
        guardian, and be able to form a legally binding contract to use our services.
      </p>

      <h2>3. Seller accounts &amp; subscriptions</h2>
      <ul>
        <li>Sellers must provide accurate business and contact information and keep it up to date.</li>
        <li>
          Paid plans are billed on a subscription basis. Plan limits (such as the number of products
          or images) apply as shown at the time of purchase.
        </li>
        <li>You are responsible for keeping your login credentials secure and for all activity on your account.</li>
        <li>We may suspend or remove accounts that violate these terms or applicable law.</li>
      </ul>

      <h2>4. Seller responsibilities</h2>
      <ul>
        <li>List only products you are legally allowed to sell, with accurate descriptions, prices and images.</li>
        <li>Fulfil confirmed orders, honor your stated delivery and return terms, and respond to buyers fairly.</li>
        <li>Comply with all applicable laws, taxes and regulations in Pakistan.</li>
      </ul>

      <h2>5. Buyers &amp; orders</h2>
      <p>
        When you place an order, you enter into a transaction directly with the seller. {SITE_NAME}
        helps facilitate discovery, ordering and payment, but the seller is responsible for the
        product, delivery, and any after-sales support. Please review a seller&apos;s delivery and
        return information before ordering.
      </p>

      <h2>6. Payments</h2>
      <ul>
        <li>
          Payments may be made online through our third-party payment gateway or by Cash on Delivery,
          where offered by the seller.
        </li>
        <li>
          Online payments are processed by the payment provider under their own terms. We do not store
          your full card details.
        </li>
        <li>
          Refunds, cancellations and disputes for a purchase are handled according to the seller&apos;s
          policy and applicable consumer law.
        </li>
      </ul>

      <h2>7. Prohibited items &amp; conduct</h2>
      <p>You agree not to list, sell, buy, or use {SITE_NAME} for:</p>
      <ul>
        <li>illegal, counterfeit, stolen, or restricted goods;</li>
        <li>fraudulent, misleading, or harmful activity;</li>
        <li>content that infringes others&apos; intellectual property or privacy;</li>
        <li>attempts to disrupt, reverse-engineer, or gain unauthorized access to our systems.</li>
      </ul>

      <h2>8. Content &amp; intellectual property</h2>
      <p>
        Sellers retain ownership of the content they upload but grant {SITE_NAME} a license to host
        and display it for the purpose of operating the service. The {SITE_NAME} name, logo and
        platform are our property and may not be used without permission.
      </p>

      <h2>9. Disclaimers &amp; limitation of liability</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of any kind. To the maximum
        extent permitted by law, {SITE_NAME} is not liable for the quality, safety or legality of
        products, the conduct of buyers or sellers, or any indirect or consequential loss arising
        from your use of the platform.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using {SITE_NAME} at any time. We may suspend or terminate access if you breach
        these terms or where required to protect the platform or other users.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of {SITE_NAME} after changes take
        effect means you accept the updated terms.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of Pakistan, and any disputes are subject to the
        jurisdiction of the courts of Pakistan.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms? Email us at <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
