import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE_EMAIL, SITE_NAME, SITE_DOMAIN } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Restricted & Prohibited Products Policy · ${SITE_NAME}`,
  description: `Products, services, and content not permitted on ${SITE_NAME}.`,
};

export default function ProhibitedProductsPolicyPage() {
  return (
    <LegalPage
      title="Restricted & Prohibited Products Policy"
      intro={`${SITE_NAME} is committed to providing a safe, lawful, and trustworthy platform for individuals and businesses to create online stores and showcase products.`}
      icon="file"
    >
      <p><strong>Website:</strong> https://{SITE_DOMAIN}</p>

      <h2>1. Purpose</h2>
      <p>
        This Restricted &amp; Prohibited Products Policy establishes the categories of products, services, and content that are not permitted on {SITE_NAME}.
      </p>
      <p>
        <em>{SITE_NAME} strictly prohibits drugs, medicines, narcotics, pornography, sexually explicit content, and all other products or services identified as prohibited under this policy.</em>
      </p>
      <p>
        This policy applies to every merchant, store, product listing, advertisement, description, photograph, and other content published through {SITE_NAME}.
      </p>
      <p>It forms an integral part of {SITE_NAME}&apos;s Terms &amp; Conditions.</p>

      <h2>2. Strictly Prohibited Categories</h2>
      <p>
        The following products, services, and content are not permitted on {SITE_NAME} under any circumstances, unless {SITE_NAME} formally revises this policy.
      </p>

      <h3>2.1 Drugs, Narcotics, and Medicines</h3>
      <p>{SITE_NAME} prohibits all listings involving:</p>
      <ul>
        <li>Illegal drugs and narcotics.</li>
        <li>Recreational drugs and controlled substances.</li>
        <li>Prescription medicines and pharmaceuticals.</li>
        <li>Over-the-counter pharmaceutical medicines.</li>
        <li>Unauthorized medicinal substances.</li>
        <li>Drug paraphernalia and equipment marketed for illegal drug consumption.</li>
        <li>Products containing prohibited or controlled psychoactive substances.</li>
        <li>Unregistered medicinal products.</li>
        <li>Products falsely advertised as treating, preventing, or curing diseases.</li>
        <li>Unauthorized veterinary medicines.</li>
      </ul>
      <p>
        <em>{SITE_NAME} does not permit the sale or promotion of drugs or pharmaceutical medicines through merchant stores, even where a product may otherwise be legally available through authorized sellers.</em>
      </p>
      <p>
        Ordinary cosmetics and personal-care items may be permitted where lawful, non-medicinal, and compliant with platform requirements.
      </p>

      <h3>2.2 Adult Content and Sexually Explicit Material</h3>
      <p>{SITE_NAME} strictly prohibits:</p>
      <ul>
        <li>Pornographic images, videos, and written material.</li>
        <li>Sexually explicit photographs or illustrations.</li>
        <li>AI-generated pornographic or sexually explicit content.</li>
        <li>Adult entertainment services.</li>
        <li>Escort services and sexual services.</li>
        <li>Sexually explicit products and merchandise.</li>
        <li>Sex toys and products primarily intended for sexual stimulation.</li>
        <li>Sexual exploitation material.</li>
        <li>Listings that link to, promote, or advertise prohibited adult websites or services.</li>
      </ul>
      <p>
        <em>No pornographic, obscene, or sexually explicit content may be uploaded, displayed, shared, advertised, or promoted through {SITE_NAME}.</em>
      </p>
      <p>
        Ordinary fashion, clothing, and beauty-product listings are permitted provided their presentation is non-explicit and otherwise complies with this policy.
      </p>

      <h3>2.3 Weapons and Explosives</h3>
      <p>Prohibited products include:</p>
      <ul>
        <li>Firearms and ammunition.</li>
        <li>Explosives, fireworks, and explosive devices.</li>
        <li>Prohibited knives and other restricted weapons.</li>
        <li>Unauthorized weapon parts or accessories.</li>
        <li>Products designed primarily to facilitate unlawful violence.</li>
      </ul>

      <h3>2.4 Alcohol, Tobacco, and Vaping Products</h3>
      <p>{SITE_NAME} prohibits:</p>
      <ul>
        <li>Alcoholic beverages and intoxicating products.</li>
        <li>Cigarettes, cigars, and tobacco.</li>
        <li>Vaping devices and electronic cigarettes.</li>
        <li>Nicotine products and related restricted accessories.</li>
        <li>Other products marketed for unauthorized intoxication or smoking.</li>
      </ul>

      <h3>2.5 Counterfeit, Pirated, and Stolen Products</h3>
      <p>Prohibited products include:</p>
      <ul>
        <li>Counterfeit branded merchandise.</li>
        <li>Unauthorized replicas sold in violation of intellectual property rights.</li>
        <li>Pirated software, movies, music, or digital content.</li>
        <li>Stolen goods.</li>
        <li>Forged documents and certificates.</li>
        <li>Unauthorized products infringing trademarks, copyrights, or other protected rights.</li>
      </ul>

      <h3>2.6 Gambling and Fraudulent Financial Products</h3>
      <p>{SITE_NAME} prohibits:</p>
      <ul>
        <li>Gambling and betting services.</li>
        <li>Unauthorized lotteries.</li>
        <li>Fraudulent investment opportunities.</li>
        <li>Ponzi or pyramid schemes.</li>
        <li>Unlicensed financial services.</li>
        <li>Fraudulent cryptocurrency or investment schemes.</li>
        <li>Products or services intended to facilitate financial scams.</li>
      </ul>

      <h3>2.7 Hazardous and Dangerous Materials</h3>
      <p>Prohibited products include:</p>
      <ul>
        <li>Dangerous or unlawfully sold chemicals.</li>
        <li>Radioactive materials.</li>
        <li>Prohibited toxic substances.</li>
        <li>Explosive or highly hazardous materials.</li>
        <li>Products prohibited by applicable environmental, safety, or health regulations.</li>
      </ul>

      <h3>2.8 Illegal Wildlife and Animal Products</h3>
      <p>Prohibited products include:</p>
      <ul>
        <li>Protected or endangered wildlife.</li>
        <li>Illegal wildlife-derived goods.</li>
        <li>Products made from unlawfully traded protected species.</li>
        <li>Animals or animal products whose sale is prohibited by applicable laws.</li>
      </ul>

      <h3>2.9 Fraudulent, Extremist, or Illegal Content</h3>
      <p>{SITE_NAME} prohibits products, services, or content involving:</p>
      <ul>
        <li>Forged identities or documentation.</li>
        <li>Stolen financial information.</li>
        <li>Fraudulent services or scams.</li>
        <li>Terrorism or violent extremism.</li>
        <li>Material promoting unlawful violence.</li>
        <li>Products or services facilitating criminal activities.</li>
        <li>Malicious software or unauthorized hacking services.</li>
      </ul>

      <h2>3. Restricted Products Requiring Additional Authorization</h2>
      <p>
        Certain products may be lawful but require regulatory approvals, business licenses, supporting documentation, or additional verification.
      </p>
      <p>Examples may include:</p>
      <ul>
        <li>Food products subject to mandatory safety or licensing requirements.</li>
        <li>Cosmetics and personal-care products subject to regulatory requirements.</li>
        <li>Medical devices that are not prohibited under Section 2.</li>
        <li>Certain electrical, electronic, or telecommunications equipment.</li>
        <li>Other products requiring government authorization.</li>
      </ul>
      <p>
        Merchants must comply with all applicable licensing, registration, labeling, safety, and regulatory requirements.
      </p>
      <p>{SITE_NAME} may request supporting documentation before permitting such listings.</p>
      <p>
        <em>A restricted product must not be listed where prior authorization is legally required but has not been obtained, or where {SITE_NAME} has expressly required approval that has not yet been granted.</em>
      </p>
      <p>{SITE_NAME} reserves the right to prohibit any restricted category entirely.</p>

      <h2>4. Merchant Responsibilities</h2>
      <p>
        Every merchant is responsible for ensuring that the products and services offered through their store comply with this policy and applicable laws.
      </p>
      <p>Merchants must:</p>
      <ol>
        <li>List only permitted and lawful products.</li>
        <li>Provide accurate product descriptions, images, prices, and other information.</li>
        <li>Refrain from selling or advertising prohibited products.</li>
        <li>Obtain required licenses and permissions.</li>
        <li>Avoid misleading or disguising prohibited products.</li>
        <li>Cooperate with platform compliance reviews.</li>
        <li>Remove or correct violating listings when directed by {SITE_NAME}.</li>
        <li>Report suspected misuse of their store or account.</li>
      </ol>
      <p>
        Merchants must not bypass restrictions by using alternative product names, misspellings, misleading categories, external links, or coded descriptions.
      </p>

      <h2>5. Product Screening and Monitoring</h2>
      <p>
        {SITE_NAME} reserves the right to screen and monitor product listings to identify potentially prohibited or unlawful content.
      </p>
      <p>Screening and monitoring may include:</p>

      <h3>5.1 Keyword Screening</h3>
      <p>
        {SITE_NAME} may use automated or manual keyword-based checks to identify suspicious product names, descriptions, or categories. Listings containing potentially prohibited terminology may be flagged for additional review.
      </p>

      <h3>5.2 Manual Product Review</h3>
      <p>
        {SITE_NAME} may conduct manual product reviews before or after publication. Depending on the functionality available, administrators may review, approve, reject, remove, or request changes to product listings.
      </p>

      <h3>5.3 Complaint-Based Monitoring</h3>
      <p>
        {SITE_NAME} may investigate listings reported by customers, merchants, third parties, payment providers, or competent authorities.
      </p>

      <h3>5.4 Additional Verification</h3>
      <p>
        {SITE_NAME} may request identification, proof of ownership, product documentation, licenses, or other supporting evidence where appropriate.
      </p>
      <p>
        {SITE_NAME} does not guarantee that every product will undergo manual approval before publication or that every prohibited listing will be identified immediately.
      </p>

      <h2>6. Removal, Suspension, and Enforcement</h2>
      <p>
        Where {SITE_NAME} identifies or reasonably suspects a policy violation, it may take one or more of the following actions:
      </p>
      <ul>
        <li>Remove or disable prohibited product listings.</li>
        <li>Restrict the visibility of suspicious listings.</li>
        <li>Reject product submissions.</li>
        <li>Request additional documentation.</li>
        <li>Temporarily restrict product publishing.</li>
        <li>Suspend merchant accounts or stores.</li>
        <li>Permanently terminate repeat or serious offenders.</li>
        <li>Restrict future use of the platform.</li>
        <li>Cooperate with competent regulatory or law-enforcement authorities where required or appropriate.</li>
      </ul>
      <p>Serious violations may result in immediate action without prior notice.</p>
      <p>
        {SITE_NAME} reserves the right to determine whether a product or service complies with its policies, subject to applicable laws.
      </p>

      <h2>7. Prohibited Transactions Outside {SITE_NAME}</h2>
      <p>These restrictions apply even where merchants arrange payments or deliveries independently.</p>
      <p>
        Merchants must not use {SITE_NAME} storefronts to advertise, promote, facilitate, or direct customers toward prohibited transactions through:
      </p>
      <ul>
        <li>Cash on Delivery.</li>
        <li>Bank transfers.</li>
        <li>Mobile wallets.</li>
        <li>Social media.</li>
        <li>Messaging applications.</li>
        <li>External websites.</li>
        <li>Any other payment or communication method.</li>
      </ul>
      <p>
        Using third-party channels to complete a prohibited transaction does not exempt a merchant from this policy.
      </p>

      <h2>8. Reporting Prohibited Products</h2>
      <p>Customers, merchants, and third parties are encouraged to report suspicious or prohibited listings.</p>
      <p>Reports may be submitted to: <strong>{SITE_EMAIL}</strong></p>
      <p>Where possible, reports should include:</p>
      <ul>
        <li>Store name or URL.</li>
        <li>Product name or URL.</li>
        <li>Description of the suspected violation.</li>
        <li>Relevant screenshots or supporting information.</li>
      </ul>
      <p>{SITE_NAME} will assess received reports and take action where appropriate.</p>

      <h2>9. Compliance With Laws and Payment Provider Requirements</h2>
      <p>
        All merchants must comply with applicable laws and regulations of Pakistan and other relevant jurisdictions.
      </p>
      <p>
        Merchants must also comply with applicable restrictions imposed on {SITE_NAME} by its payment service providers and other authorized partners.
      </p>
      <p>{SITE_NAME} may impose stricter restrictions than those required by law.</p>
      <p>
        The fact that a product is legally available for sale does not automatically mean it is permitted on {SITE_NAME}.
      </p>

      <h2>10. Policy Updates</h2>
      <p>
        {SITE_NAME} reserves the right to amend, expand, or update this Restricted &amp; Prohibited Products Policy.
      </p>
      <p>Changes may be introduced to address:</p>
      <ul>
        <li>Changes in applicable laws.</li>
        <li>Regulatory requirements.</li>
        <li>Payment service provider conditions.</li>
        <li>Emerging fraud or safety risks.</li>
        <li>Platform compliance requirements.</li>
      </ul>
      <p>Material changes will be communicated where required by applicable law.</p>
      <p>
        Merchants are responsible for complying with the version of the policy applicable to their use of {SITE_NAME}.
      </p>

      <h2>11. Relationship With Terms &amp; Conditions</h2>
      <p>This policy forms part of {SITE_NAME}&apos;s Terms &amp; Conditions.</p>
      <p>
        By using {SITE_NAME} and accepting the applicable Terms &amp; Conditions, merchants agree to comply with this policy.
      </p>
      <p>
        In the event of an inconsistency between this policy and the general Terms &amp; Conditions, the more restrictive product-safety requirement will apply to the extent permitted by law.
      </p>

      <h2>12. Contact Information</h2>
      <p>For questions, product compliance concerns, or reports of prohibited listings:</p>
      <p>
        <strong>{SITE_NAME}</strong><br />
        Website: https://{SITE_DOMAIN}<br />
        Email: <strong>{SITE_EMAIL}</strong>
      </p>
    </LegalPage>
  );
}
