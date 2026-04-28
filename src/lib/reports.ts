import { supabase } from "@/lib/supabase/client";

export type ClassReport = {
  id: string;
  class_id: string | null;
  teacher_id: string | null;
  content: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ClassReportRow = Omit<ClassReport, "profiles"> & {
  profiles?:
    | {
        full_name: string | null;
        email: string | null;
      }
    | null
    | Array<{
        full_name: string | null;
        email: string | null;
      }>;
};

export async function getReportsForClass(
  classId: string
): Promise<ClassReport[]> {
  const { data, error } = await supabase
    .from("class_reports")
    .select(
      "id, class_id, teacher_id, content, created_at, profiles(full_name, email)"
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((report: ClassReportRow) => ({
    ...report,
    profiles: Array.isArray(report.profiles)
      ? (report.profiles[0] ?? null)
      : (report.profiles ?? null),
  }));
}

export async function createClassReport(
  classId: string,
  content: string
): Promise<ClassReport> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in as a teacher to create a report.");
  }

  const { data, error } = await supabase
    .from("class_reports")
    .insert({
      class_id: classId,
      content: content.trim(),
      teacher_id: user.id,
    })
    .select("id, class_id, teacher_id, content, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
