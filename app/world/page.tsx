import { redirect } from "next/navigation";

// The world moved to the index. Keep old links alive.
export default function WorldPage() {
  redirect("/");
}
