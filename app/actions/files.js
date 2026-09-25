"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/zip", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "image/png", "image/jpeg"];

export async function uploadFile(formData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول لرفع الملفات." };
    const blob = formData.get("file");
    if (!blob || typeof blob === "string") return { error: "اختر ملفًا صالحًا." };
    if (blob.size > MAX_SIZE) return { error: "الحد الأقصى للملف هو 50MB." };
    if (!ALLOWED.includes(blob.type)) return { error: "صيغة الملف غير مسموح بها." };
    const contentType = formData.get("content_type");
    if (!["lecture", "summary", "questions", "audio_lecture", "other"].includes(contentType)) return { error: "نوع المحتوى غير صالح." };
    const safeName = blob.name.replace(/[^\w.\-() ]/g, "_");
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: storageError } = await supabase.storage.from("study-files").upload(path, blob, { contentType: blob.type, upsert: false });
    if (storageError) return { error: `تعذّر رفع الملف إلى التخزين: ${storageError.message}` };
    const { error } = await supabase.from("files").insert({
    title: String(formData.get("title") || safeName).slice(0, 180), storage_path: path, original_name: safeName, mime_type: blob.type, size_bytes: blob.size,
    content_type: contentType, stage_id: formData.get("stage_id"), semester_id: formData.get("semester_id"), subject_id: formData.get("subject_id"), academic_year_id: formData.get("academic_year_id"), batch_id: formData.get("batch_id") || null, uploader_id: user.id, status: "pending"
    });
    if (error) { await supabase.storage.from("study-files").remove([path]); return { error: `تم رفع الملف لكن تعذّر حفظ بياناته: ${error.message}` }; }
    revalidatePath("/"); return { success: "تم إرسال الملف للمراجعة." };
  } catch (error) {
    console.error("uploadFile action failed", error);
    return { error: `حدث خطأ خادمي أثناء الرفع: ${error?.message || "غير معروف"}` };
  }
}

export async function reviewFile(fileId, status, rejectionReason = null) {
  if (!['approved', 'rejected'].includes(status)) return { error: "حالة غير صالحة." };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "admin" && profile?.role !== "moderator") return { error: "غير مصرح لك بهذه العملية." };
  const { error } = await supabase.from("files").update({ status, reviewed_at: new Date().toISOString(), reviewer_id: user.id, rejection_reason: status === 'rejected' ? rejectionReason?.slice(0, 500) : null }).eq("id", fileId).eq("status", "pending");
  if (error) return { error: "تعذّر تحديث حالة الملف." }; revalidatePath("/"); return { success: true };
}

async function staffClient() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (!user || !["admin", "moderator"].includes(profile?.role)) throw new Error("غير مصرح لك بهذه العملية.");
  return supabase;
}
export async function addCatalogItem(formData) {
  try { const supabase = await staffClient(); const kind = formData.get("kind"), name = String(formData.get("name") || "").trim(); if (!name) return { error: "الاسم مطلوب." };
    const data = kind === "stage" ? { name, sort_order: Number(formData.get("sort_order") || 0) } : kind === "semester" ? { name, stage_id: formData.get("stage_id"), sort_order: Number(formData.get("sort_order") || 0) } : kind === "subject" ? { name, stage_id: formData.get("stage_id"), semester_id: formData.get("semester_id"), code: String(formData.get("code") || "").trim() || null } : kind === "year" ? { name, starts_on: formData.get("starts_on") || null, ends_on: formData.get("ends_on") || null } : kind === "batch" ? { name, graduation_year: Number(formData.get("graduation_year")) || null } : null;
    const table = { stage: "stages", semester: "semesters", subject: "subjects", year: "academic_years", batch: "batches" }[kind]; if (!table || !data) return { error: "نوع بيانات غير صالح." }; const { error } = await supabase.from(table).insert(data); if (error) return { error: error.message }; revalidatePath("/admin"); revalidatePath("/upload"); revalidatePath("/"); return { success: "تمت الإضافة بنجاح." };
  } catch (e) { return { error: e.message || "تعذرت الإضافة." }; }
}
export async function deleteCatalogItem(kind, id) {
  try { const supabase = await staffClient(); const table = { stage: "stages", semester: "semesters", subject: "subjects", year: "academic_years", batch: "batches" }[kind]; if (!table) return { error: "نوع غير صالح." }; const { error } = await supabase.from(table).delete().eq("id", id); if (error) return { error: "لا يمكن الحذف: العنصر مرتبط ببيانات أخرى أو لا تملك صلاحية." }; revalidatePath("/admin"); revalidatePath("/upload"); revalidatePath("/"); return { success: "تم الحذف." };
  } catch (e) { return { error: e.message || "تعذر الحذف." }; }
}
export async function getDownloadUrl(fileId) {
  try { const supabase = await createClient(); const { data: file, error } = await supabase.from("files").select("storage_path,original_name").eq("id", fileId).eq("status", "approved").single(); if (error || !file) return { error: "الملف غير متاح للتنزيل." }; const { data, error: urlError } = await supabase.storage.from("study-files").createSignedUrl(file.storage_path, 60); if (urlError) return { error: urlError.message }; return { url: data.signedUrl, name: file.original_name };
  } catch (e) { return { error: e.message || "تعذر إنشاء رابط التنزيل." }; }
}
export async function updateManagedFile(formData) {
  try { const supabase = await staffClient(); const id = formData.get("id"); const title = String(formData.get("title") || "").trim(); const content_type = formData.get("content_type"); const status = formData.get("status"); const stage_id=formData.get("stage_id"),semester_id=formData.get("semester_id"),subject_id=formData.get("subject_id"),academic_year_id=formData.get("academic_year_id"),batch_id=formData.get("batch_id")||null; if (!id || !title || !stage_id || !semester_id || !subject_id || !academic_year_id || !["lecture","summary","questions","audio_lecture","other"].includes(content_type) || !["pending","approved","rejected"].includes(status)) return { error: "أكمل بيانات تصنيف الملف." }; const patch = { title, content_type, status, stage_id, semester_id, subject_id, academic_year_id, batch_id, published_at: status === "approved" ? new Date().toISOString() : null }; const { error } = await supabase.from("files").update(patch).eq("id", id); if (error) return { error: error.message }; revalidatePath("/"); revalidatePath("/admin"); return { success: "تم تعديل الملف." }; } catch (e) { return { error: e.message || "تعذر التعديل." }; }
}
export async function deleteManagedFile(id) {
  try { const supabase = await staffClient(); const { data:file, error:readError } = await supabase.from("files").select("storage_path").eq("id", id).single(); if (readError || !file) return { error:"الملف غير موجود." }; const { error:storageError } = await supabase.storage.from("study-files").remove([file.storage_path]); if (storageError) return { error:`تعذر حذف الملف المخزن: ${storageError.message}` }; const { error } = await supabase.from("files").delete().eq("id",id); if (error) return { error:error.message }; revalidatePath("/"); revalidatePath("/admin"); return { success:"تم حذف الملف نهائيًا." }; } catch(e) { return { error:e.message||"تعذر الحذف." }; }
}
