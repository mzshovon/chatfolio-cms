import { Suspense } from "react";
import { EditUserView } from "./edit-user-view";

export default function AdminEditUserPage() {
  return (
    <Suspense fallback={null}>
      <EditUserView />
    </Suspense>
  );
}
