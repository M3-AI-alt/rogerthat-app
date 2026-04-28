import { supabase } from "@/lib/supabase/client";

const REPORT_ATTACHMENTS_BUCKET = "report-attachments";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

const allowedExtensions = new Set([
  "csv",
  "doc",
  "docx",
  "jpeg",
  "jpg",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "webp",
  "xls",
  "xlsx",
]);

export const reportAttachmentAccept =
  ".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx";

export type ReportAttachment = {
  id: string;
  report_id: string | null;
  file_name: string;
  file_type: string | null;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  download_url?: string | null;
};

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function getSafeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export function isSupportedReportAttachment(file: File): boolean {
  return allowedExtensions.has(getFileExtension(file.name));
}

export async function uploadReportAttachment(
  file: File,
  reportId: string
): Promise<ReportAttachment> {
  if (!isSupportedReportAttachment(file)) {
    throw new Error("This file type is not supported for report attachments.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in as a teacher to upload files.");
  }

  const safeFileName = getSafeFileName(file.name);
  const storagePath = `${reportId}/${Date.now()}-${safeFileName}`;
  const { error: uploadError } = await supabase.storage
    .from(REPORT_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("report_attachments")
    .insert({
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || getFileExtension(file.name),
      file_url: storagePath,
      report_id: reportId,
      uploaded_by: user.id,
    })
    .select(
      "id, report_id, file_name, file_type, file_url, file_size, uploaded_by, created_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return withSignedUrl(data);
}

async function withSignedUrl(
  attachment: ReportAttachment
): Promise<ReportAttachment> {
  const { data, error } = await supabase.storage
    .from(REPORT_ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.file_url, SIGNED_URL_EXPIRES_IN_SECONDS);

  return {
    ...attachment,
    download_url: error ? null : data.signedUrl,
  };
}

export async function getReportAttachments(
  reportId: string
): Promise<ReportAttachment[]> {
  const { data, error } = await supabase
    .from("report_attachments")
    .select(
      "id, report_id, file_name, file_type, file_url, file_size, uploaded_by, created_at"
    )
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map(withSignedUrl));
}
