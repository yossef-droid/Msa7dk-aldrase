import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminReview from "@/components/admin-review";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) redirect("/");
  const { data: files, error } = await supabase.from("files").select("id,title,original_name,mime_type,size_bytes,content_type,status,created_at,profiles!files_uploader_id_fkey(full_name),subjects(name),stages(name),academic_years(name)").eq("status", "pending").order("created_at", { ascending: true });
  const [stages, semesters, subjects, years, batches] = await Promise.all([supabase.from("stages").select("id,name,sort_order").order("sort_order"), supabase.from("semesters").select("id,name,stage_id,sort_order").order("sort_order"), supabase.from("subjects").select("id,name,stage_id,semester_id,code").order("name"), supabase.from("academic_years").select("id,name").order("starts_on", { ascending: false }), supabase.from("batches").select("id,name,graduation_year").order("name")]);
  const { data: managedFiles } = await supabase.from("files").select("id,title,original_name,content_type,status,created_at,subjects(name),profiles!files_uploader_id_fkey(full_name)").order("created_at", { ascending: false });
  return <AdminReview profile={profile} files={files || []} managedFiles={managedFiles || []} loadError={error?.message} catalog={{ stages: stages.data || [], semesters: semesters.data || [], subjects: subjects.data || [], years: years.data || [], batches: batches.data || [] }} />;
}
