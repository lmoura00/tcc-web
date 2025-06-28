
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "../(protect)/dashboard/components/DashboardLayout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  const supabase = createClient();
  
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}