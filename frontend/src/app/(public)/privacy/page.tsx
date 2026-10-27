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
      intro={`${SITE_NAME} respects the privacy of users, store owners, and visitors. This Policy explains how we collect, use, store, disclose, and otherwise process information obtained through ${SITE_NAME}.`}
      icon="shield"
    >
      <h2>1. Introduction</h2>
      <p>
        By using our platform, you acknowledge the data practices described in this Policy. Where required by applicable law, we will seek appropriate consent for particular uses of personal information.
      </p>

      <h2>2. Information We Collect</h2>
      <p><strong>A. Account and personal information</strong></p>
      <ul>
        <li>Name and email address.</li>
        <li>Phone number.</li>
        <li>Login and account information.</li>
        <li>Store registration details.</li>
      </ul>
      <p><strong>B. Business and store information</strong></p>
      <ul>
        <li>Business name and description.</li>
        <li>Store address and approximate or precise business location, where provided.</li>
        <li>Product names, images, descriptions, and prices.</li>
        <li>Store contact details and publicly displayed information.</li>
      </ul>
      <p><strong>C. Technical and usage information</strong></p>
      <ul>
        <li>IP address and browser information.</li>
        <li>Pages visited and interactions with listings.</li>
        <li>Search activity, referral sources, and approximate location.</li>
        <li>Cookies, advertising identifiers, and analytics data.</li>
      </ul>

      <h2>3. How We Use Information</h2>
      <p>{SITE_NAME} may use information to:</p>
      <ul>
        <li>Create and maintain user accounts and online stores.</li>
        <li>Display products and help customers discover businesses.</li>
        <li>Analyze website traffic, engagement, and user behavior.</li>
        <li>Improve platform functionality, security, and user experience.</li>
        <li>Deliver targeted advertisements and measure campaign performance.</li>
        <li>Communicate service updates, notifications, and marketing messages.</li>
        <li>Detect abuse, investigate fraud, and enforce platform policies.</li>
        <li>Comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>4. Sharing Data With Third Parties</h2>
      <p>{SITE_NAME} may share user information with third parties including:</p>
      <ul>
        <li>Advertising networks and digital marketing partners.</li>
        <li>Analytics and performance measurement providers.</li>
        <li>Cloud hosting, storage, and technology service providers.</li>
        <li>Professional advisers, legal authorities, and regulators where appropriate.</li>
      </ul>

      <h2>5. Public Store Information</h2>
      <p>
        Information that store owners choose to publish on their storefronts may be publicly accessible and indexed by search engines. Store owners should avoid publishing private information that they do not wish to make public.
      </p>

      <h2>6. Personalized Advertising and Cookies</h2>
      <p>
        {SITE_NAME} may use cookies, pixels, analytics tools, and similar technologies to understand platform usage and support personalized advertising. Users may manage certain cookies through their browser settings.
      </p>

      <h2>7. Store Owners and Customer Data</h2>
      <p>
        Store owners are independently responsible for their use of customer information received through {SITE_NAME}. Store owners must handle customer data lawfully and avoid unauthorized disclosure or misuse.
      </p>

      <h2>8. Data Storage, Security, and Retention</h2>
      <p>
        We take reasonable organizational and technical measures to protect information from unauthorized access. However, no internet-based service can be guaranteed completely secure. Information may be stored or processed in Pakistan or other countries through our technology providers.
      </p>

      <h2>9. User Privacy Requests</h2>
      <p>Subject to applicable law, users may contact {SITE_NAME} to:</p>
      <ul>
        <li>Request access to personal information.</li>
        <li>Request correction of inaccurate information.</li>
        <li>Request account deletion or deletion of eligible personal information.</li>
        <li>Unsubscribe from promotional email communications.</li>
      </ul>

      <h2>10. Children&apos;s Privacy</h2>
      <p>
        {SITE_NAME} is not intended for children to independently operate commercial storefronts without authorization required by applicable law.
      </p>

      <h2>11. Changes to This Privacy Policy</h2>
      <p>
        We may revise this Policy to reflect changes to our services, technology, or legal requirements. The updated version will be published on our website with a revised effective date.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        For privacy-related inquiries or data requests, email us at{" "}
        <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
