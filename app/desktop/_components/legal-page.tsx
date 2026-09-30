import { DesktopLayout, PageHeading } from "@/app/desktop/_components/ui";
import styles from "./profile-settings.module.css";

type PortalRole = "student" | "faculty";
type DocumentType = "privacy" | "terms";

const content = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How Teech uses your account information.",
    sections: [
      ["What we collect", "Your name, Student ID or faculty ID, course and year or department, and email for faculty. We also keep the consultation requests you make or receive, your profile photo if you add one, and your daily check-ins, points, and badges."],
      ["How we use it", "Only to run Teech: booking and managing consultations, sending in-app notifications, and showing your streak, points, and badges. We don't sell your information or use it for ads."],
      ["Who can view it", "Signed-in students can see faculty names, departments, and available dates. When you request a consultation, that faculty member sees your name, Student ID, and request details. Other students never see your requests, and your profile photo, points, and badges are visible only to you."],
      ["Help chat", "Common questions are answered inside Teech. Questions the helper can't answer are sent to Google Gemini to generate a reply, so please don't type personal information into the chat."],
      ["Keeping information safe", "Access is protected by your password and database security rules. Security question answers are stored hashed and are never shown to anyone, including you. Profile photos are private and load only for you."],
      ["How long we keep it", "We keep your information while your account is active. Deleting your account permanently removes your profile, photo, requests, points, and badges."],
      ["Your rights", "Under the Data Privacy Act of 2012, you can access, correct, or delete your personal information. You can update your details in Profile, delete your account yourself, or ask your instructor or system administrator for help."],
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Guidelines for using the Teech portal.",
    sections: [
      ["Use your own account", "Keep your password private and use the portal only with the account issued to you."],
      ["Consultation requests", "Submit accurate information and use appointment requests respectfully. Faculty may confirm or decline requests and may cancel confirmed consultations when needed. Requests that are not answered by their date expire automatically."],
      ["Acceptable use", "Don't send spam or fake requests, hold time slots you don't intend to use, or try to access other people's accounts or data. Misuse may lead to your account being restricted."],
      ["Points and badges", "Points and badges reward using Teech and have no cash or grade value. They can't be transferred, and we may adjust them if they were earned by misuse or by mistake."],
      ["Portal access", "Teech may update features or restrict access when needed to keep the portal reliable and secure."],
    ],
  },
} as const;

export function LegalPage({ role, documentType }: { role: PortalRole; documentType: DocumentType }) {
  const document = content[documentType];
  const profilePath = `/${role}/profile`;

  return (
    <DesktopLayout className={styles.screen} backTo={profilePath} role={role} activeNav="profile">
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
    </DesktopLayout>
  );
}
