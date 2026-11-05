import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME, SITE_DOMAIN } from "@/lib/constants";

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
      <p><strong>Original Effective Date:</strong> October 26, 2026<br /><strong>Website:</strong> https://{SITE_DOMAIN}</p>

      <h2>1. Introduction</h2>
      <p>
        {SITE_NAME} is an online platform that enables individuals, small businesses, and independent sellers to create online storefronts, display products, share store links, and connect with potential customers.
      </p>
      <p>
        By accessing or using {SITE_NAME}, you agree to these Terms &amp; Conditions and our Privacy Policy.
      </p>
      <p>
        Merchants who create or operate stores on {SITE_NAME} are additionally bound by our <strong>Restricted &amp; Prohibited Products Policy</strong>, which forms an integral part of these Terms &amp; Conditions.
      </p>
      <p>
        Where an electronic acceptance mechanism is provided during registration or store creation, merchants must acknowledge and accept the applicable terms before proceeding.
      </p>
      <p>If you do not agree to these terms, you must not use the platform.</p>

      <h2>2. Nature of Our Services</h2>
      <p>
        {SITE_NAME} provides digital storefront creation, product listing, business discovery, and related technology services.
      </p>
      <p>
        <strong>{SITE_NAME} is not the seller, manufacturer, supplier, shipping provider, or merchant of record for products offered by independent store owners.</strong>
      </p>
      <p>
        Unless explicitly stated otherwise, all transactions involving products listed by store owners are conducted directly between the buyer and the respective store owner.
      </p>
      <p>
        {SITE_NAME} does not guarantee the identity, legitimacy, reliability, product quality, availability, or performance of any independent seller.
      </p>
      <p>
        {SITE_NAME} reserves the right to establish rules and restrictions governing the types of products, services, businesses, and content permitted on its platform.
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
        <li>Ensuring all listed products and services comply with {SITE_NAME}&apos;s Restricted &amp; Prohibited Products Policy.</li>
        <li>Obtaining any licenses, permits, or authorizations required for selling their products or providing their services.</li>
        <li>Cooperating with {SITE_NAME} regarding complaints, investigations, and compliance reviews.</li>
      </ul>
      <p>
        Store owners must not publish fraudulent, misleading, illegal, counterfeit, prohibited, restricted without authorization, or otherwise unauthorized products or content.
      </p>
      <p>
        Merchants represent and warrant that they have the legal right to list and sell their products and that the products comply with applicable laws and {SITE_NAME}&apos;s policies.
      </p>

      <h2>3A. Restricted &amp; Prohibited Products</h2>
      <p>
        {SITE_NAME} strictly prohibits the listing, display, advertising, promotion, distribution, or sale of illegal, prohibited, or unauthorized restricted products and services through any store hosted on its platform.
      </p>
      <p>Prohibited categories include, but are not limited to:</p>

      <h3>1. Drugs, Narcotics, and Medicines</h3>
      <p>
        All narcotics, illegal drugs, controlled substances, recreational drugs, prescription medicines, over-the-counter pharmaceutical medicines, unauthorized medicinal substances, drug paraphernalia, and related prohibited products.
      </p>

      <h3>2. Adult Content and Sexually Explicit Products</h3>
      <p>
        Pornography, sexually explicit images or videos, adult entertainment, sexual services, sexually explicit merchandise, and other adult-oriented products or content prohibited by {SITE_NAME}&apos;s policies or applicable law. This includes sexually explicit material generated using artificial intelligence.
      </p>

      <h3>3. Weapons and Explosives</h3>
      <p>
        Firearms, ammunition, explosives, fireworks, prohibited weapons, dangerous weapon components, and related unauthorized products.
      </p>

      <h3>4. Alcohol, Tobacco, and Vaping Products</h3>
      <p>
        Alcoholic beverages, tobacco products, cigarettes, electronic cigarettes, vaping devices, and related smoking or intoxicating products.
      </p>

      <h3>5. Counterfeit and Stolen Goods</h3>
      <p>
        Counterfeit branded merchandise, unauthorized replicas, stolen products, pirated software, counterfeit documents, and products that infringe intellectual property rights.
      </p>

      <h3>6. Gambling and Fraudulent Financial Services</h3>
      <p>
        Gambling, betting, unauthorized lotteries, fraudulent investment schemes, Ponzi schemes, pyramid schemes, and unlicensed financial services.
      </p>

      <h3>7. Hazardous and Dangerous Materials</h3>
      <p>
        Prohibited chemicals, toxic substances, radioactive materials, dangerous explosives, and other goods whose sale is prohibited or requires authorization not held by the merchant.
      </p>

      <h3>8. Protected Wildlife and Illegal Animal Products</h3>
      <p>
        Endangered species, protected wildlife, unlawfully traded animals, and products derived from protected species.
      </p>

      <h3>9. Fraudulent, Illegal, or Deceptive Products</h3>
      <p>
        Fake identification documents, forged certificates, stolen financial information, fraudulent services, hacking tools marketed for unauthorized access, and products intended to facilitate unlawful activities.
      </p>

      <h3>10. Extremist, Hateful, and Violent Content</h3>
      <p>
        Products, materials, or services that promote terrorism, violent extremism, unlawful violence, or illegal activities.
      </p>

      <h3>11. Other Prohibited or Restricted Products</h3>
      <p>
        Any goods, services, or content prohibited by applicable Pakistani laws, regulatory authorities, {SITE_NAME}&apos;s policies, or relevant payment service provider requirements.
      </p>
      <p>
        These restrictions apply regardless of whether transactions occur through Cash on Delivery, direct bank transfer, cash payments, or any other payment method.
      </p>
      <p>
        The complete restrictions are detailed in {SITE_NAME}&apos;s separate <strong>Restricted &amp; Prohibited Products Policy</strong>, available at: https://{SITE_DOMAIN}/prohibited-products-policy
      </p>
      <p>
        {SITE_NAME} may update the prohibited categories to address emerging risks, regulatory changes, or payment provider requirements.
      </p>

      <h2>3B. Merchant Compliance and Product Legality</h2>
      <p>
        All store owners must ensure that their products, services, listings, descriptions, photographs, advertisements, and related content comply with applicable laws and {SITE_NAME}&apos;s policies.
      </p>
      <p>Merchants must not:</p>
      <ul>
        <li>Create listings for illegal or prohibited products.</li>
        <li>Disguise prohibited products using misleading names, descriptions, images, or categories.</li>
        <li>Attempt to bypass product restrictions through altered spellings, coded language, or deceptive advertising.</li>
        <li>Direct customers to external websites, messaging applications, or other channels for the purpose of completing prohibited transactions initiated through {SITE_NAME}.</li>
        <li>Upload content that infringes intellectual property rights or promotes fraudulent activities.</li>
        <li>Misrepresent product origin, authenticity, safety, or regulatory approval.</li>
      </ul>
      <p>
        {SITE_NAME} may request documentation demonstrating product authenticity, ownership, licensing, or regulatory compliance.
      </p>
      <p>
        Products requiring special authorization may only be listed where permitted by applicable law and expressly approved by {SITE_NAME}.
      </p>
      <p>
        {SITE_NAME} reserves the right to reject any business or product category that creates unacceptable legal, compliance, financial, or reputational risk.
      </p>

      <h2>3C. Product Screening, Monitoring, and Review</h2>
      <p>
        To protect users and maintain platform integrity, {SITE_NAME} reserves the right to screen, monitor, flag, review, approve, reject, restrict, or remove product listings.
      </p>
      <p>Our compliance measures may include:</p>
      <ul>
        <li><strong>Keyword-Based Screening:</strong> Checking product titles, descriptions, and other listing information for suspicious or prohibited terminology.</li>
        <li><strong>Automated Flagging:</strong> Identifying potentially prohibited products using automated rules, keyword matching, or other screening technologies.</li>
        <li><strong>Manual Product Review:</strong> Reviewing product listings before or after publication, where such review processes are available.</li>
        <li><strong>Complaint-Based Investigations:</strong> Investigating suspicious listings reported by customers, merchants, third parties, or relevant authorities.</li>
        <li><strong>Administrative Enforcement:</strong> Removing listings, restricting store activity, or suspending accounts that violate {SITE_NAME}&apos;s policies.</li>
      </ul>
      <p>
        {SITE_NAME} may require individual products or categories to undergo review before publication.
      </p>
      <p>
        <strong>{SITE_NAME} does not guarantee that every listing is manually reviewed before publication or that all prohibited content will be detected immediately.</strong>
      </p>
      <p>
        Publication of a product does not constitute endorsement, certification, or verification by {SITE_NAME}.
      </p>
      <p>
        Merchants remain responsible for compliance regardless of whether their listings have been screened or reviewed.
      </p>

      <h2>3D. Policy Violations and Enforcement</h2>
      <p>
        {SITE_NAME} maintains a zero-tolerance policy toward the intentional listing, promotion, or sale of illegal and prohibited products.
      </p>
      <p>Where a violation is identified or reasonably suspected, {SITE_NAME} may:</p>
      <ol>
        <li>Immediately remove, hide, disable, or restrict the relevant listing.</li>
        <li>Reject submitted products or request modifications.</li>
        <li>Temporarily suspend the merchant&apos;s ability to publish products.</li>
        <li>Suspend or permanently terminate the merchant&apos;s store or account.</li>
        <li>Request additional identity, ownership, product, or licensing documentation.</li>
        <li>Restrict future registrations associated with serious or repeated violations.</li>
        <li>Cooperate with competent authorities and payment service providers where legally required or appropriate.</li>
        <li>Take other reasonable measures to protect customers and platform integrity.</li>
      </ol>
      <p>
        {SITE_NAME} may act without prior notice where reasonably necessary to address serious safety, legal, or compliance risks.
      </p>
      <p>
        Users may report suspected violations at: <strong>{SITE_EMAIL}</strong>
      </p>
      <p>
        {SITE_NAME} will assess reports and determine appropriate action based on the available information and applicable requirements.
      </p>

      <h2>4. Orders and Transactions</h2>
      <p>
        Any order, purchase agreement, or other transaction between a buyer and an independent store owner is the responsibility of those parties.
      </p>
      <p>
        Unless {SITE_NAME} expressly offers a separate transaction or payment service, {SITE_NAME} does not receive, hold, process, guarantee, or refund payments made to independent sellers.
      </p>
      <p>
        {SITE_NAME} does not guarantee successful completion, dispatch, delivery, or satisfaction of an order.
      </p>
      <p>
        Store owners are responsible for determining and communicating their own payment arrangements, subject to applicable laws and {SITE_NAME}&apos;s policies.
      </p>

      <h2>5. Payment Safety</h2>
      <p><strong>IMPORTANT CUSTOMER SAFETY NOTICE</strong></p>
      <p>{SITE_NAME} strongly advises customers to:</p>
      <ul>
        <li>Always choose <strong>Cash on Delivery (COD)</strong> where available.</li>
        <li>Avoid making advance payments to store owners.</li>
        <li>Verify the seller&apos;s identity, product details, and delivery arrangements before placing an order.</li>
        <li>Avoid transferring money to personal bank accounts, mobile wallets, or other payment methods before receiving goods.</li>
      </ul>
      <p>
        Advance payments made directly to independent store owners are at the buyer&apos;s own risk.
      </p>
      <p>
        To the maximum extent permitted by applicable law, {SITE_NAME} is not responsible for advance payment losses, seller fraud, non-delivery, or the failure of a seller to fulfill an order.
      </p>

      <h2>6. Shipping and Deliveries</h2>
      <p>
        All shipping and delivery arrangements are managed independently by the relevant store owner or their chosen delivery provider.
      </p>
      <p>
        {SITE_NAME} does not operate a courier service or guarantee shipping dates, delivery charges, successful delivery, or the condition of goods upon arrival.
      </p>
      <p>Any shipping-related issue must be addressed directly with the store owner.</p>

      <h2>7. Returns, Refunds, and Cancellations</h2>
      <p>
        {SITE_NAME} does not establish, administer, process, or guarantee a universal return, refund, or cancellation policy for products sold by independent store owners.
      </p>
      <p>
        Each store owner determines and communicates their own policies, subject to applicable law.
      </p>
      <p>
        Store owners may accept, reject, or cancel orders in accordance with their published terms and applicable legal obligations.
      </p>
      <p>Buyers should review the seller&apos;s policies before making a purchase.</p>

      <h2>8. Accounts and Store Content</h2>
      <p>
        Users must provide accurate registration information and maintain the confidentiality of their login credentials.
      </p>
      <p>
        Store owners retain responsibility for content they upload, including photographs, logos, business details, and product descriptions.
      </p>
      <p>
        By uploading content, store owners grant {SITE_NAME} a non-exclusive, worldwide, royalty-free license to host, reproduce, display, distribute, and promote that content as necessary to operate, advertise, and improve the platform.
      </p>
      <p>Store owners confirm that they have the necessary rights to upload and use their content.</p>
      <p>All uploaded content must comply with these Terms &amp; Conditions and the Restricted &amp; Prohibited Products Policy.</p>
      <p>
        {SITE_NAME} reserves the right to restrict or remove content that violates its policies or applicable laws.
      </p>

      <h2>9. Advertising and Data Usage</h2>
      <p>
        {SITE_NAME} may display advertisements, sponsored listings, featured products, and promotional content across its platform, including on free storefronts.
      </p>
      <p>
        {SITE_NAME} may collect, analyze, and share information with third parties for analytics, platform improvement, advertising, personalization, and other purposes described in our Privacy Policy.
      </p>
      <p>Use of personal information remains subject to applicable laws and the Privacy Policy.</p>
      <p>
        {SITE_NAME} may refuse or remove advertisements that promote prohibited products, fraudulent activities, illegal services, or content violating platform policies.
      </p>

      <h2>10. Platform Availability and Changes</h2>
      <p>
        {SITE_NAME} may introduce, modify, restrict, or discontinue features, plans, product limits, or services.
      </p>
      <p>
        We do not guarantee uninterrupted access, error-free operation, specific search rankings, customer traffic, sales, or commercial results.
      </p>
      <p>Any applicable subscription fees will be communicated before users are charged.</p>

      <h2>10A. Subscription Payments and Settlement</h2>
      <p>
        {SITE_NAME} may offer paid subscription plans that provide additional store features, product listing capacity, or other premium services.
      </p>
      <p>
        Payment gateways integrated by {SITE_NAME} for its own subscriptions are intended exclusively for collecting payments for services provided directly by {SITE_NAME}.
      </p>
      <p>
        Subscription payment proceeds collected through these gateways will be settled into {SITE_NAME}&apos;s designated business bank account, subject to the payment service provider&apos;s applicable settlement arrangements.
      </p>
      <p>
        <strong>{SITE_NAME} does not use these subscription payment gateways to collect, hold, or distribute proceeds from sales made by independent store owners.</strong>
      </p>
      <p>
        Transactions involving products sold by merchants remain independent arrangements between the respective merchants and their customers.
      </p>
      <p>
        Applicable subscription prices, billing arrangements, cancellation conditions, and refund terms will be displayed or communicated to users before payment, subject to applicable law.
      </p>

      <h2>11. Suspension or Termination</h2>
      <p>
        {SITE_NAME} reserves the right to remove product listings, restrict accounts, suspend stores, or terminate access where reasonably necessary due to suspected fraud, illegal activity, policy violations, security concerns, or legal requirements.
      </p>
      <p>
        Violations of Sections 3A–3D or the Restricted &amp; Prohibited Products Policy may result in immediate removal of listings, suspension of publishing privileges, or termination of the merchant&apos;s account.
      </p>
      <p>Where appropriate, we may cooperate with law enforcement or other competent authorities.</p>
      <p>
        Termination of an account does not eliminate any existing legal obligations or liabilities arising from the merchant&apos;s activities.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, {SITE_NAME} shall not be liable for losses arising from independent sellers&apos; acts or omissions, including:
      </p>
      <ul>
        <li>Failed or fraudulent transactions.</li>
        <li>Lost advance payments.</li>
        <li>Undelivered, damaged, defective, or counterfeit products.</li>
        <li>Shipping delays or delivery failures.</li>
        <li>Seller cancellations or refusals to issue refunds.</li>
        <li>Inaccurate third-party product information.</li>
        <li>Disputes between store owners and customers.</li>
        <li>Illegal or prohibited products independently listed or offered by merchants.</li>
      </ul>
      <p>
        {SITE_NAME} does not guarantee that all prohibited products, fraudulent listings, or policy violations will be identified or removed before publication.
      </p>
      <p>
        Nothing in these Terms excludes or limits liability or statutory rights that cannot lawfully be excluded or limited.
      </p>

      <h2>13. Governing Law</h2>
      <p>These Terms shall be governed by the applicable laws of Pakistan.</p>
      <p>
        Disputes involving {SITE_NAME} shall be subject to the jurisdiction of competent courts in Pakistan, without prejudice to mandatory consumer protection rights.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>{SITE_NAME} may update these Terms from time to time.</p>
      <p>
        Material changes will be communicated through reasonable means where required. Continued use after changes take effect constitutes acceptance to the extent permitted by law.
      </p>
      <p>Where required, users may be asked to expressly accept updated Terms &amp; Conditions.</p>
      <p>
        Changes to the Restricted &amp; Prohibited Products Policy may be introduced to address legal requirements, emerging risks, or payment provider restrictions.
      </p>

      <h2>15. Contact</h2>
      <p>For platform-related questions, complaints, or concerns:</p>
      <p>
        <strong>{SITE_NAME}</strong><br />
        Website: https://{SITE_DOMAIN}<br />
        Email: <strong>{SITE_EMAIL}</strong>
      </p>
      <p>
        For reports of illegal, fraudulent, restricted, or prohibited products, please contact the same email address with relevant product or store details.
      </p>
    </LegalPage>
  );
}
