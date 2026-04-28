import { supabase } from "@/lib/supabase/client";

const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";
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

export const messageAttachmentAccept =
  ".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx";

export type MessageAttachment = {
  id: string;
  message_id: string | null;
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

export function isSupportedMessageAttachment(file: File): boolean {
  return allowedExtensions.has(getFileExtension(file.name));
}

export async function uploadMessageAttachment(
  file: File,
  messageId: string
): Promise<MessageAttachment> {
  if (!isSupportedMessageAttachment(file)) {
    throw new Error("This file type is not supported for message attachments.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to upload files.");
  }

  const safeFileName = getSafeFileName(file.name);
  const storagePath = `${messageId}/${Date.now()}-${safeFileName}`;
  const { error: uploadError } = await supabase.storage
    .from(MESSAGE_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("message_attachments")
    .insert({
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || getFileExtension(file.name),
      file_url: storagePath,
      message_id: messageId,
      uploaded_by: user.id,
    })
    .select(
      "id, message_id, file_name, file_type, file_url, file_size, uploaded_by, created_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return withSignedUrl(data);
}

async function withSignedUrl(
  attachment: MessageAttachment
): Promise<MessageAttachment> {
  const { data, error } = await supabase.storage
    .from(MESSAGE_ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.file_url, SIGNED_URL_EXPIRES_IN_SECONDS);

  return {
    ...attachment,
    download_url: error ? null : data.signedUrl,
  };
}

export async function getMessageAttachments(
  messageIds: string[]
): Promise<Record<string, MessageAttachment[]>> {
  if (messageIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("message_attachments")
    .select(
      "id, message_id, file_name, file_type, file_url, file_size, uploaded_by, created_at"
    )
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const attachments = await Promise.all((data ?? []).map(withSignedUrl));

  return attachments.reduce<Record<string, MessageAttachment[]>>(
    (groups, attachment) => {
      if (!attachment.message_id) {
        return groups;
      }

      groups[attachment.message_id] = [
        ...(groups[attachment.message_id] ?? []),
        attachment,
      ];
      return groups;
    },
    {}
  );
}
