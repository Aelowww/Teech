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
      ["Who can view it", "Students can view faculty details needed to book a consultation. Your personal profile is visible only to you and authorized portal functions."],
      ["Keeping information safe", "Account access is protected by your password and the portal's Supabase authentication and database access rules."],
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Guidelines for using the Teech portal.",
    sections: [
      ["Use your own account", "Keep your password private and use the portal only with the account issued to you."],
      ["Consultation requests", "Submit accurate information and use appointment requests respectfully. Faculty may confirm, decline, or reschedule requests as needed."],
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
