import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy · ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what information ${SITE_NAME} collects, how we use it, and the choices you have.`}
      icon="shield"
    >
      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> — for sellers: name, email, phone, shop details, and
          login credentials.
        </li>
        <li>
          <strong>Order &amp; delivery details</strong> — for buyers placing an order: name, phone,
          delivery address and city, and any order notes. No buyer account is required.
        </li>
        <li>
          <strong>Location</strong> — if you use &quot;Near me&quot;, we ask your browser for your
          location to sort nearby shops and products. This is only accessed with your permission.
        </li>
        <li>
          <strong>Payment information</strong> — online payments are processed by our third-party
          payment gateway. We receive the payment status, not your full card details.
        </li>
        <li>
          <strong>Usage &amp; device data</strong> — basic information such as pages viewed and device
          type, used to operate and improve the service.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>to create and manage shops, listings and orders;</li>
        <li>to connect buyers with sellers and enable ordering (including via WhatsApp);</li>
        <li>to process payments and subscriptions;</li>
        <li>to show nearby shops and products when you use location features;</li>
        <li>to secure the platform, prevent fraud, and comply with the law.</li>
      </ul>

      <h2>3. How we share information</h2>
      <ul>
        <li>
          <strong>With sellers</strong> — your order and delivery details are shared with the relevant
          seller so they can fulfil your order.
        </li>
        <li>
          <strong>With service providers</strong> — such as our payment gateway and hosting providers,
          only as needed to run the service.
        </li>
        <li>
          <strong>For legal reasons</strong> — where required by law or to protect our users and
          platform.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. Cookies &amp; local storage</h2>
      <p>
        We use your browser&apos;s local storage to keep your shopping cart and to keep sellers signed
        in. These are necessary for the site to work and are stored on your device.
      </p>

      <h2>5. Location data</h2>
      <p>
        Location access is optional and only used when you tap &quot;Near me&quot;. Your browser will
        ask for permission first. You can deny or revoke this permission at any time in your browser
        settings — the rest of the site continues to work without it.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep information for as long as needed to provide the service, meet legal or accounting
        obligations, and resolve disputes. Sellers may request deletion of their account data.
      </p>

      <h2>7. Security</h2>
      <p>
        We take reasonable measures to protect your information, including encrypted connections and
        secure handling of credentials. No method of transmission over the internet is completely
        secure, but we work to keep your data safe.
      </p>

      <h2>8. Your choices &amp; rights</h2>
      <ul>
        <li>access, correct, or delete your account information;</li>
        <li>control location and cookie/local-storage permissions in your browser;</li>
        <li>contact us with any privacy request or concern.</li>
      </ul>

      <h2>9. Children</h2>
      <p>
        {SITE_NAME} is not directed at children under 18. We do not knowingly collect personal
        information from children.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will revise the &quot;last updated&quot; date
        above when we do.
      </p>

      <h2>11. Contact</h2>
      <p>
        For any privacy question or request, email us at{" "}
        <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
