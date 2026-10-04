import { VerificationGate } from "@/app/mobile/_components/verification";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <VerificationGate role="faculty" activeNav="calendar">{children}</VerificationGate>;
}
