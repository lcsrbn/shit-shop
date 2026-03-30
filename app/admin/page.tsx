import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "shit_shop_admin_session";

export default async function AdminEntryPage() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (hasAdminSession) {
    redirect("/admin/orders");
  }

  redirect("/admin/login");
}