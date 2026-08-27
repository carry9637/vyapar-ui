const lastUpdated = "August 27, 2026";
const appName = "Vyapar UI";
const productionDomain = "https://vyapar-ui.vercel.app";
const contactEmail = "Replace with your support email";

function LegalLayout({ title, description, children }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-blue-600">{appName}</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">{title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{description}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Last Updated: {lastUpdated}</p>
        </header>
        <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">{children}</article>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-600">{children}</div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="This policy explains how the current Vyapar UI application handles information for Smart Ads and related business tools."
    >
      <Section title="Introduction">
        <p>
          {appName} is a business management interface that includes Smart Ads, a feature that lets a business connect Meta/Facebook assets and create advertising campaigns.
          This page applies to the public frontend at {productionDomain} and the current Smart Ads integration.
        </p>
      </Section>

      <Section title="Information We Collect">
        <BulletList
          items={[
            "Business and campaign details entered in Smart Ads, such as campaign name, headline, caption, website URL, audience choices, budget, schedule, and selected creative.",
            "Inventory or Marketing Studio creative information selected by the user for an ad.",
            "Meta/Facebook connection information returned after authorization, including Meta user identity, granted permissions, Business Portfolios, Facebook Pages, optional linked Instagram account references, and Ad Accounts.",
            "Meta publishing results, such as Campaign, Ad Set, image, Creative, and Ad IDs when a real paused campaign is created.",
          ]}
        />
      </Section>

      <Section title="Meta/Facebook Integration">
        <p>
          Smart Ads may ask you to authorize access to Meta/Facebook business assets so the app can discover available Pages, Ad Accounts, Business Portfolios, optional Instagram professional accounts, and create paused ad objects through Meta APIs.
        </p>
      </Section>

      <Section title="How Information Is Used">
        <BulletList
          items={[
            "To show the connected Meta account and selectable business assets.",
            "To prepare, validate, and submit advertising campaign requests selected by the user.",
            "To store local Smart Ads drafts and show publish status in the application.",
            "To troubleshoot connection, asset discovery, and publishing errors without exposing secrets or access tokens.",
          ]}
        />
      </Section>

      <Section title="Facebook Pages and Ad Account Information">
        <p>
          The app reads Page and Ad Account names, IDs, categories, permissions/tasks where available, currency, timezone, account status, and related business references. These are used for asset selection and campaign publishing.
        </p>
      </Section>

      <Section title="Advertising Campaign Information">
        <p>
          Campaign data may include ad text, destination URL, creative image data chosen by the user, audience settings, schedule, budget, and the Meta object IDs returned by Meta after publishing.
        </p>
      </Section>

      <Section title="Permissions and Access Required">
        <p>
          The current Meta integration requests permissions configured for Smart Ads, including ads management/read access, business management access, and Page listing/engagement access. Permission availability depends on Meta account roles, business settings, and Meta approval.
        </p>
      </Section>

      <Section title="Data Storage and Security">
        <p>
          The current implementation does not use a persistent database for Meta connection data. Meta access tokens and selected asset state are held temporarily in server memory. Smart Ads campaign drafts, local campaign records, and returned Meta IDs are stored in browser local storage for this frontend prototype.
        </p>
      </Section>

      <Section title="Data Sharing">
        <p>
          Smart Ads sends campaign and creative information to Meta only when the user chooses to publish. We do not sell personal information. Data may be processed by Meta/Facebook as required to provide advertising services.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          Meta/Facebook services are governed by Meta's own terms, policies, and privacy practices. Users should review Meta's applicable advertising and platform policies before publishing campaigns.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          In-memory Meta connection data lasts only while the backend server process keeps that session state. Browser local storage remains on the user's device/browser until cleared by the user or the application.
        </p>
      </Section>

      <Section title="User Rights and Data Deletion">
        <p>
          Users may disconnect Meta in Smart Ads, revoke the app from Meta/Facebook settings, clear browser local storage, or request removal assistance using the contact information below. See the Data Deletion page for details.
        </p>
      </Section>

      <Section title="Changes to This Privacy Policy">
        <p>We may update this policy as Smart Ads changes, especially when persistent backend storage, analytics, or additional Meta features are added.</p>
      </Section>

      <Section title="Contact">
        <p>For privacy questions or deletion requests, contact: {contactEmail}.</p>
      </Section>
    </LegalLayout>
  );
}

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" description="These terms describe the basic rules for using Vyapar UI and the Smart Ads integration.">
      <Section title="Acceptance of Terms">
        <p>By using {appName}, you agree to these terms. If you do not agree, do not use the application or connect Meta/Facebook assets.</p>
      </Section>

      <Section title="Service Description">
        <p>
          {appName} provides business UI workflows including inventory, marketing tools, Online Store features, and Smart Ads. Smart Ads helps users prepare campaigns, connect Meta business assets, and create paused Meta advertising objects.
        </p>
      </Section>

      <Section title="Meta/Facebook Integration">
        <p>
          Advertising campaigns created through Smart Ads use Meta's advertising platform and are also subject to Meta's applicable terms, advertising standards, platform policies, and account requirements.
        </p>
      </Section>

      <Section title="User Responsibilities">
        <BulletList
          items={[
            "Provide accurate business, campaign, creative, budget, destination URL, and account information.",
            "Use only Meta Pages, Ad Accounts, images, and content you are authorized to use.",
            "Review all campaign settings before publishing, even when campaigns are created paused.",
          ]}
        />
      </Section>

      <Section title="Advertising Campaign Responsibility">
        <p>
          Users are responsible for their campaign content, targeting choices, budget settings, landing pages, legal compliance, and compliance with Meta advertising policies.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          The app may connect with Meta/Facebook and other third-party services. We do not control third-party platforms, approvals, availability, ad delivery, review decisions, billing, or policy enforcement.
        </p>
      </Section>

      <Section title="Availability of Service">
        <p>The service may change, pause, or become unavailable due to maintenance, hosting, third-party API limitations, account restrictions, or platform policy changes.</p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {appName} is not liable for indirect losses, ad account restrictions, rejected ads, lost revenue, platform outages, or third-party policy decisions.
        </p>
      </Section>

      <Section title="Changes to Terms">
        <p>We may update these terms when the application, Smart Ads, backend storage, or Meta integration changes.</p>
      </Section>

      <Section title="Contact">
        <p>For terms questions, contact: {contactEmail}.</p>
      </Section>
    </LegalLayout>
  );
}

export function DataDeletion() {
  return (
    <LegalLayout
      title="User Data Deletion Instructions"
      description="Use this page to understand how to remove data associated with the current Meta/Facebook Smart Ads connection."
    >
      <Section title="Current Data Storage">
        <p>
          The current project does not have a persistent database for Meta connection data. Meta access tokens, connected user details, permissions, asset lists, and selected Page/Ad Account are stored temporarily in backend memory. Smart Ads drafts and publish records are stored in the user's browser local storage.
        </p>
      </Section>

      <Section title="Disconnect Meta in the App">
        <p>
          Open Smart Ads and use the Disconnect action in the Meta connection panel. This clears the temporary backend Meta connection state for the running server session.
        </p>
      </Section>

      <Section title="Remove App Access from Meta/Facebook">
        <p>
          You can also remove this app's permissions from your Meta/Facebook account settings. In Facebook, go to Settings and privacy, then Settings, then Business Integrations or Apps and Websites, find this app, and remove its access.
        </p>
      </Section>

      <Section title="Clear Browser Prototype Data">
        <p>
          Because campaign drafts and local publish records are currently saved in browser local storage, you can remove them by clearing site data for {productionDomain} in your browser settings.
        </p>
      </Section>

      <Section title="Request Deletion Assistance">
        <p>
          To request help removing data associated with your Meta/Facebook connection, contact: {contactEmail}. Include the business name and Meta account/Page/Ad Account reference if available. Do not send passwords, access tokens, or secrets.
        </p>
      </Section>

      <Section title="Future Persistent Storage">
        <p>
          If a database is added later, this page and the deletion process will be updated to describe permanent records and the exact deletion workflow.
        </p>
      </Section>
    </LegalLayout>
  );
}
