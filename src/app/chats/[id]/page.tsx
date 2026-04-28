"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getChatById,
  getChatMessages,
  sendMessage,
  type Chat,
  type ChatMember,
  type ChatMessage,
  type MessageType,
} from "@/lib/chats";
import {
  getMessageAttachments,
  isSupportedMessageAttachment,
  messageAttachmentAccept,
  uploadMessageAttachment,
  type MessageAttachment,
} from "@/lib/message-attachments";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

function getMemberName(member: ChatMember): string {
  return (
    member.profiles?.full_name?.trim() ||
    member.profiles?.email?.trim() ||
    "Unnamed member"
  );
}

function getSenderName(message: ChatMessage): string {
  return (
    message.profiles?.full_name?.trim() ||
    message.profiles?.email?.trim() ||
    "Member"
  );
}

function getChatTitle(chat: Chat | null): string {
  if (chat?.chat_type === "CLASS_GROUP_CHAT" && chat.class_groups) {
    return `${chat.class_groups.code} Class Room`;
  }

  if (chat?.title?.trim()) {
    return chat.title.trim();
  }

  return chat?.chat_type === "CLASS_GROUP_CHAT" ? "Class Room" : "Private Chat";
}

function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getChatTypeLabel(chat: Chat | null): string {
  if (chat?.chat_type === "CLASS_GROUP_CHAT") {
    return "Class Room";
  }

  if (chat?.chat_type === "SUPERVISED_PRIVATE_CHAT") {
    return "Private Chat";
  }

  return "Messages";
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(size: number | null): string {
  if (!size) {
    return "File";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ParticipantGroup({
  members,
  title,
}: {
  members: ChatMember[];
  title: string;
}): ReactElement {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Not added yet.</p>
        ) : (
          members.map((member) => (
            <p
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
              key={member.id}
            >
              {getMemberName(member)}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

export default function ChatDetailPage(): ReactElement {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const [chat, setChat] = useState<Chat | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<
    Record<string, MessageAttachment[]>
  >({});
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("CHAT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showNewMessageHint, setShowNewMessageHint] = useState(false);

  const loadMessages = useCallback(async () => {
    const messageResult = await getChatMessages(chatId);
    setMessages(messageResult);

    try {
      const attachmentGroups = await getMessageAttachments(
        messageResult.map((message) => message.id)
      );
      setAttachmentsByMessage(attachmentGroups);
    } catch {
      setAttachmentsByMessage({});
    }
  }, [chatId]);

  const loadChat = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [chatResult, messageResult, profileResult] = await Promise.all([
        getChatById(chatId),
        getChatMessages(chatId),
        getCurrentUserProfile(),
      ]);
      setChat(chatResult);
      setMessages(messageResult);
      setProfile(profileResult);
      try {
        const attachmentGroups = await getMessageAttachments(
          messageResult.map((message) => message.id)
        );
        setAttachmentsByMessage(attachmentGroups);
      } catch {
        setAttachmentsByMessage({});
      }

      if (!chatResult) {
        setErrorMessage("This chat was not found or you are not a member.");
      }
    } catch {
      setErrorMessage(
        "Could not load this conversation. Make sure you have access and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent && !selectedFile) {
      return;
    }

    setErrorMessage("");
    setIsSending(true);

    try {
      const textContent = trimmedContent || selectedFile?.name || "Attachment";
      const messageContent =
        messageType === "REPORT"
          ? `[REPORT]\n${textContent}`
          : textContent;
      const message = await sendMessage(chatId, messageContent);

      if (selectedFile) {
        const attachment = await uploadMessageAttachment(selectedFile, message.id);
        setAttachmentsByMessage((currentAttachments) => ({
          ...currentAttachments,
          [message.id]: [
            ...(currentAttachments[message.id] ?? []),
            attachment,
          ],
        }));
      }

      setMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      );
      setContent("");
      setSelectedFile(null);
      setMessageType("CHAT");
    } catch {
      setErrorMessage("Could not send this message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if ((!content.trim() && !selectedFile) || isSending) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  const groupedMembers = useMemo(() => {
    const members = chat?.chat_members ?? [];
    return {
      ceos: members.filter((member) => member.member_role === "CEO"),
      directors: members.filter(
        (member) => member.member_role === "DIRECTOR"
      ),
      parents: members.filter((member) => member.member_role === "PARENT"),
      teachers: members.filter((member) => member.member_role === "TEACHER"),
    };
  }, [chat?.chat_members]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadChat();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadChat]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `chat_id=eq.${chatId}`,
          schema: "public",
          table: "messages",
        },
        () => {
          setNewMessageCount((currentCount) => currentCount + 1);
          setShowNewMessageHint(true);
          void loadMessages().catch(() => {
            setErrorMessage("A new message arrived, but it could not be loaded.");
          });

          window.setTimeout(() => {
            setShowNewMessageHint(false);
          }, 2500);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_attachments",
        },
        () => {
          void loadMessages().catch(() => {
            setErrorMessage("A file was added, but it could not be loaded.");
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, loadMessages]);

  return (
    <AppShell>
      <PageNav dashboardHref="/chats" dashboardLabel="Rooms & Chats" />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                {getChatTypeLabel(chat)}
              </p>
              <h1 className="mt-1 text-xl font-semibold">
                {getChatTitle(chat)}
              </h1>
              {chat?.class_groups ? (
                <p className="mt-1 text-sm text-blue-100">
                  {chat.class_groups.code} - {chat.class_groups.name}
                </p>
              ) : null}
            </div>
            <p className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              {(chat?.chat_members ?? []).length} participants
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="order-2 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm lg:order-1 lg:self-start">
          <p className="text-base font-semibold text-slate-950">
            Participants
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Members of this room.
          </p>
          <div className="mt-5 grid gap-5">
            <ParticipantGroup members={groupedMembers.ceos} title="CEO" />
            <ParticipantGroup
              members={groupedMembers.directors}
              title="Director(s)"
            />
            <ParticipantGroup
              members={groupedMembers.teachers}
              title="Teacher"
            />
            <ParticipantGroup
              members={groupedMembers.parents}
              title="Parent(s)"
            />
          </div>
        </aside>

        <div className="order-1 flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:order-2">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-slate-950">
                Messages
              </p>
              {newMessageCount > 0 ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {newMessageCount} new
                </span>
              ) : null}
            </div>
            {showNewMessageHint ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                New message received.
              </p>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#eef3f1] p-3 sm:p-4">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading messages...</p>
            ) : messages.length === 0 ? (
              <EmptyState
                description="Send the first message or report in this room."
                title="No messages yet"
              />
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === profile?.id;
                const isReport = message.content.startsWith("[REPORT]\n");
                const displayContent = isReport
                  ? message.content.replace(/^\[REPORT\]\n/, "")
                  : message.content;
                const messageAttachments = attachmentsByMessage[message.id] ?? [];

                return (
                  <article
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[72%] ${
                        isOwnMessage
                          ? "rounded-br-md bg-[#d9fdd3] text-slate-950"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-950"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          {getSenderName(message)}
                        </p>
                        {isReport ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-800">
                            Report
                          </span>
                        ) : null}
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                          {getRoleLabel(message.profiles?.role)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">
                        {displayContent}
                      </p>
                      {messageAttachments.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {messageAttachments.map((attachment) => (
                            <a
                              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                              href={attachment.download_url ?? attachment.file_url}
                              key={attachment.id}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <span className="block break-all">
                                {attachment.file_name}
                              </span>
                              <span className="mt-1 block text-xs font-medium text-slate-500">
                                {formatFileSize(attachment.file_size)}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-2 text-right text-[11px] font-medium text-slate-500">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <form
            className="sticky bottom-0 grid gap-3 border-t border-slate-200 bg-white p-3 sm:p-4"
            onSubmit={handleSendMessage}
          >
            <div className="flex flex-wrap gap-2">
              <button
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                  messageType === "CHAT"
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => setMessageType("CHAT")}
                type="button"
              >
                Message
              </button>
              <button
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                  messageType === "REPORT"
                    ? "bg-blue-700 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => setMessageType("REPORT")}
                type="button"
              >
                Report
              </button>
              <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                Upload file
                <input
                  accept={messageAttachmentAccept}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (file && !isSupportedMessageAttachment(file)) {
                      setErrorMessage(
                        "Supported files: images, PDF, Word, Excel, PowerPoint, and CSV."
                      );
                      event.target.value = "";
                      setSelectedFile(null);
                      return;
                    }

                    setErrorMessage("");
                    setSelectedFile(file);
                  }}
                  type="file"
                />
              </label>
            </div>
            {selectedFile ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                <span className="font-medium">
                  {selectedFile.name} · {formatFileSize(selectedFile.size)}
                </span>
                <button
                  className="font-semibold text-blue-800"
                  onClick={() => setSelectedFile(null)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {messageType === "REPORT" ? "Report" : "Message"}
              <textarea
                className="min-h-16 resize-y rounded-lg border border-slate-300 bg-slate-50 p-4 text-base text-slate-950"
                onKeyDown={handleComposerKeyDown}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  messageType === "REPORT"
                    ? "Write a class report..."
                    : "Write a message. Press Enter to send, Shift+Enter for a new line."
                }
                value={content}
              />
            </label>
            <button
              className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSending || (!content.trim() && !selectedFile)}
              type="submit"
            >
              {isSending
                ? "Sending..."
                : messageType === "REPORT"
                  ? "Send Report"
                  : "Send"}
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
