import { VerificationGate } from "@/app/desktop/_components/verification";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <VerificationGate role="student" activeNav="faculty">{children}</VerificationGate>;
}
