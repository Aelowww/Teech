import { MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import styles from "./profile-settings.module.css";

type PortalRole = "student" | "faculty";
type DocumentType = "privacy" | "terms";

const content = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How Teech uses your account information.",
    sections: [
      ["Information we use", "Teech uses your profile details and appointment requests to help students and faculty arrange consultations."],
      ["Who can view it", "Signed-in students can see faculty names, departments, and available dates. When you request a consultation, that faculty member sees your name, Student ID, and request details. Other students never see your requests."],
      ["Keeping information safe", "Account access is protected by your password and the portal's database access rules. Security question answers are stored hashed and are never shown to anyone, including you."],
      ["Your choices", "You can edit your profile and photo at any time. You can also permanently delete your account from your Profile, which removes your profile, requests, and consultation history."],
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Guidelines for using the Teech portal.",
    sections: [
      ["Use your own account", "Keep your password private and use the portal only with the account issued to you."],
      ["Consultation requests", "Submit accurate information and use appointment requests respectfully. Faculty may confirm or decline requests and may cancel confirmed consultations when needed. Requests that are not answered by their date expire automatically."],
      ["Portal access", "Teech may update features or restrict access when needed to keep the portal reliable and secure."],
    ],
  },
} as const;

export function LegalPage({ role, documentType }: { role: PortalRole; documentType: DocumentType }) {
  const document = content[documentType];
  const profilePath = `/${role}/profile`;

  return (
    <MobileLayout className={styles.screen} backTo={profilePath} role={role} activeNav="profile">
      <section className={styles.page}>
        <PageHeading title={document.title} subtitle={document.subtitle} />
        <div className={styles.legalContent}>
          {document.sections.map(([heading, copy]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{copy}</p>
            </section>
          ))}
        </div>
      </section>
    </MobileLayout>
  );
}
