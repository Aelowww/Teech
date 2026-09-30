import { GenericSkeleton } from "@/app/mobile/_components/screen-skeletons";

export default function Loading() {
  return <GenericSkeleton backTo="/student/profile" role="student" activeNav="profile" />;
}
