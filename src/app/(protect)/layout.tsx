
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

  const { data: profile, error } = await (await supabase)
    .from("profiles")
    .select("id, first_name, last_name, photo_url, email, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return redirect("/login");
  }

  return (
    <DashboardLayout user={profile}>
      {children}
    </DashboardLayout>
  );
}