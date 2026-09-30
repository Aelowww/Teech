import { GenericSkeleton } from "@/app/mobile/_components/screen-skeletons";

export default function Loading() {
  return <GenericSkeleton backTo="/faculty/profile" role="faculty" activeNav="profile" />;
}
