"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  getChatById,
  getChatMessages,
  getMyChats,
  sendMessage,
  type Chat,
  type ChatMember,
  type ChatMessage,
  type MessageType,
} from "@/lib/chats";
import {
  getLatestReadTimestamp,
  getUnreadCount,
  hasUnreadReport,
  readChatReadState,
  writeChatReadState,
  type ChatReadState,
} from "@/lib/chat-read-state";
import {
  getMessageAttachments,
  isSupportedMessageAttachment,
  messageAttachmentAccept,
  uploadMessageAttachment,
  type MessageAttachment,
} from "@/lib/message-attachments";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const imageAttachmentAccept = ".png,.jpg,.jpeg,.webp";

function getProfileName(profile?: {
  full_name: string | null;
  email: string | null;
} | null): string {
  return profile?.full_name?.trim() || profile?.email?.trim() || "Member";
}

function getMemberName(member: ChatMember): string {
  return getProfileName(member.profiles);
}

function getSenderName(message: ChatMessage): string {
  return getProfileName(message.profiles);
}

function getReportSenderLabel(message: ChatMessage): string {
  const role = getRoleLabel(message.profiles?.role);
  const name = getSenderName(message);

  return message.profiles?.role === "TEACHER"
    ? `Teacher: ${name}`
    : `${role}: ${name}`;
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

function getChatTypeLabel(chat: Chat | null): string {
  return chat?.chat_type === "CLASS_GROUP_CHAT" ? "Room" : "Private";
}

function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

function isReportMessage(message: ChatMessage): boolean {
  return message.message_type === "REPORT" || message.content.startsWith("[REPORT]\n");
}

function getMessageText(message: ChatMessage): string {
  return isReportMessage(message)
    ? message.content.replace(/^\[REPORT\]\n/, "")
    : message.content;
}

function getMessagePreview(message?: ChatMessage): string {
  if (!message) {
    return "No messages yet";
  }

  const text = getMessageText(message);
  return isReportMessage(message) ? `Report: ${text}` : text;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
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

function isImageAttachment(attachment: MessageAttachment): boolean {
  const fileName = attachment.file_name.toLowerCase();
  return (
    attachment.file_type?.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((extension) =>
      fileName.endsWith(extension)
    )
  );
}

function getChatInitial(chat: Chat): string {
  const title = getChatTitle(chat).trim();
  return title.charAt(0).toUpperCase() || "#";
}

function chatMatchesSearch(
  chat: Chat,
  lastMessage: ChatMessage | undefined,
  searchQuery: string
): boolean {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    getChatTitle(chat),
    getChatTypeLabel(chat),
    getMessagePreview(lastMessage),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function ChatListItem({
  chat,
  hasLatestReport,
  isActive,
  lastMessage,
  unreadCount,
}: {
  chat: Chat;
  hasLatestReport: boolean;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount: number;
}): ReactElement {
  const cappedUnreadCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      className={`flex min-w-0 gap-3 border-b border-slate-200 px-3 py-3 transition hover:bg-slate-50 sm:px-4 ${
        isActive
          ? "bg-emerald-50"
          : unreadCount > 0
            ? "bg-emerald-50/60"
            : "bg-white"
      }`}
      href={`/chats/${chat.id}`}
    >
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
          chat.chat_type === "CLASS_GROUP_CHAT" ? "bg-emerald-600" : "bg-blue-700"
        }`}
      >
        {getChatInitial(chat)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-950">
            {getChatTitle(chat)}
          </p>
          <span
            className={`shrink-0 text-[11px] font-medium ${
              unreadCount > 0 ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {lastMessage ? formatTime(lastMessage.created_at) : "--"}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
            {getChatTypeLabel(chat)}
          </span>
          {hasLatestReport ? (
            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
              Latest report
            </span>
          ) : null}
          {unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
              New
            </span>
          ) : null}
          <p
            className={`truncate text-xs ${
              unreadCount > 0 ? "font-semibold text-slate-800" : "text-slate-500"
            }`}
          >
            {getMessagePreview(lastMessage)}
          </p>
          {unreadCount > 0 ? (
            <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {cappedUnreadCount}
            </span>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase text-emerald-700">
            <span className="rounded-full bg-white px-2 py-0.5">
              Sound cue
            </span>
            <span className="rounded-full bg-white px-2 py-0.5">
              Visual cue
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function AttachmentCard({
  attachment,
}: {
  attachment: MessageAttachment;
}): ReactElement {
  const href = attachment.download_url ?? attachment.file_url;

  if (isImageAttachment(attachment)) {
    return (
      <a
        className="group block max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-sm transition hover:border-emerald-300"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived and not configured for next/image. */}
        <img
          alt={attachment.file_name}
          className="max-h-64 w-full object-cover sm:max-h-72"
          src={href}
        />
        <span className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-600">
          <span className="truncate font-semibold">{attachment.file_name}</span>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
            Open
          </span>
        </span>
      </a>
    );
  }

  return (
    <a
      className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-sm transition hover:border-emerald-300"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-800">
          {attachment.file_name}
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500">
          {formatFileSize(attachment.file_size)}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        Open
      </span>
    </a>
  );
}

function FileCard({ attachment }: { attachment: MessageAttachment }): ReactElement {
  const href = attachment.download_url ?? attachment.file_url;

  return (
    <a
      className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-sm transition hover:border-emerald-300"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-800">
          {attachment.file_name}
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500">
          {formatFileSize(attachment.file_size)}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        Open
      </span>
    </a>
  );
}

function ChatInfoPanel({
  chat,
  onClose,
  reportMessages,
  sharedFiles,
  sharedImages,
}: {
  chat: Chat | null;
  onClose?: () => void;
  reportMessages: ChatMessage[];
  sharedFiles: MessageAttachment[];
  sharedImages: MessageAttachment[];
}): ReactElement {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 bg-[#f0f2f5] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">
              {getChatTitle(chat)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
              {getChatTypeLabel(chat)}
            </p>
          </div>
          {onClose ? (
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg font-semibold text-slate-700"
              onClick={onClose}
              type="button"
            >
              x
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto p-4">
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <h2 className="text-sm font-semibold text-emerald-950">
            Supervision
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            School communication is supervised for safety and quality. CEO and
            selected Directors can monitor rooms and private chats according to
            school rules.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-950">
            Participants
          </h2>
          <div className="mt-3 grid gap-2">
            {(chat?.chat_members ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No participants loaded.</p>
            ) : (
              (chat?.chat_members ?? []).map((member) => (
                <div
                  className="rounded-lg border border-slate-200 p-3"
                  key={member.id}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {getMemberName(member)}
                  </p>
                  <p className="mt-1 text-xs uppercase text-slate-500">
                    {getRoleLabel(member.member_role)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-950">
            Report messages
          </h2>
          <div className="mt-3 grid gap-2">
            {reportMessages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Report messages will appear here.
              </p>
            ) : (
              reportMessages.map((message) => (
                <a
                  className="rounded-lg border border-blue-100 bg-blue-50 p-3"
                  href={`#message-${message.id}`}
                  key={message.id}
                  onClick={onClose}
                >
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Report · {formatTime(message.created_at)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {getReportSenderLabel(message)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                    {getMessageText(message)}
                  </p>
                </a>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-950">
            Shared images
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {sharedImages.length === 0 ? (
              <p className="col-span-3 text-sm text-slate-500">
                No images yet.
              </p>
            ) : (
              sharedImages.map((attachment) => (
                <a
                  className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  href={attachment.download_url ?? attachment.file_url}
                  key={attachment.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived and not configured for next/image. */}
                  <img
                    alt={attachment.file_name}
                    className="h-full w-full object-cover"
                    src={attachment.download_url ?? attachment.file_url}
                  />
                </a>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-950">
            Shared files
          </h2>
          <div className="mt-3 grid gap-2">
            {sharedFiles.length === 0 ? (
              <p className="text-sm text-slate-500">No files yet.</p>
            ) : (
              sharedFiles.map((attachment) => (
                <FileCard attachment={attachment} key={attachment.id} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ChatDetailPage(): ReactElement {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const [chats, setChats] = useState<Chat[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastMessagesByChat, setLastMessagesByChat] = useState<
    Record<string, ChatMessage | undefined>
  >({});
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [readState, setReadState] = useState<ChatReadState>({});
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<
    Record<string, MessageAttachment[]>
  >({});
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("CHAT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [notificationNotice, setNotificationNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allAttachments = useMemo(
    () => Object.values(attachmentsByMessage).flat(),
    [attachmentsByMessage]
  );
  const sharedImages = useMemo(
    () => allAttachments.filter(isImageAttachment),
    [allAttachments]
  );
  const sharedFiles = useMemo(
    () => allAttachments.filter((attachment) => !isImageAttachment(attachment)),
    [allAttachments]
  );
  const filteredChats = useMemo(
    () =>
      chats.filter((item) =>
        chatMatchesSearch(item, lastMessagesByChat[item.id], searchQuery)
      ),
    [chats, lastMessagesByChat, searchQuery]
  );
  const reportMessages = useMemo(
    () => messages.filter(isReportMessage),
    [messages]
  );

  function clearSelectedFile() {
    setSelectedFile(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const markChatAsRead = useCallback(
    (targetChatId: string, chatMessages: ChatMessage[]) => {
      const nextReadState = {
        ...readChatReadState(),
        [targetChatId]: getLatestReadTimestamp(chatMessages),
      };

      writeChatReadState(nextReadState);
      setReadState(nextReadState);
    },
    []
  );

  const loadMessages = useCallback(async () => {
    const messageResult = await getChatMessages(chatId);
    setMessages(messageResult);
    setMessagesByChat((currentMessages) => ({
      ...currentMessages,
      [chatId]: messageResult,
    }));
    setLastMessagesByChat((currentMessages) => ({
      ...currentMessages,
      [chatId]: messageResult.at(-1),
    }));
    markChatAsRead(chatId, messageResult);

    try {
      const attachmentGroups = await getMessageAttachments(
        messageResult.map((message) => message.id)
      );
      setAttachmentsByMessage(attachmentGroups);
    } catch {
      setAttachmentsByMessage({});
    }
  }, [chatId, markChatAsRead]);

  const loadChat = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setReadState(readChatReadState());
      const [chatList, chatResult, profileResult] = await Promise.all([
        getMyChats(),
        getChatById(chatId),
        getCurrentUserProfile(),
      ]);
      setChats(chatList);
      setChat(chatResult);
      setProfile(profileResult);

      const messageEntries = await Promise.all(
        chatList.map(async (item) => {
          const itemMessages = await getChatMessages(item.id);
          return [item.id, itemMessages] as const;
        })
      );
      const nextMessagesByChat = Object.fromEntries(messageEntries);
      setMessagesByChat(nextMessagesByChat);
      setLastMessagesByChat(
        Object.fromEntries(
          messageEntries.map(([itemId, itemMessages]) => [
            itemId,
            itemMessages.at(-1),
          ])
        )
      );

      await loadMessages();

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
  }, [chatId, loadMessages]);

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
      const message = await sendMessage(chatId, textContent, messageType);

      if (selectedFile) {
        const attachment = await uploadMessageAttachment(selectedFile, message.id);
        setAttachmentsByMessage((currentAttachments) => ({
          ...currentAttachments,
          [message.id]: [...(currentAttachments[message.id] ?? []), attachment],
        }));
      }

      setMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      );
      setMessagesByChat((currentMessages) => {
        const currentChatMessages = currentMessages[chatId] ?? [];
        const nextChatMessages = currentChatMessages.some(
          (currentMessage) => currentMessage.id === message.id
        )
          ? currentChatMessages
          : [...currentChatMessages, message];

        return {
          ...currentMessages,
          [chatId]: nextChatMessages,
        };
      });
      markChatAsRead(
        chatId,
        messages.some((currentMessage) => currentMessage.id === message.id)
          ? messages
          : [...messages, message]
      );
      setLastMessagesByChat((currentMessages) => ({
        ...currentMessages,
        [chatId]: message,
      }));
      setContent("");
      clearSelectedFile();
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadChat();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadChat]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `chat_id=eq.${chatId}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const senderId =
            typeof payload.new.sender_id === "string"
              ? payload.new.sender_id
              : "";

          if (senderId && senderId !== profile?.id) {
            setNotificationNotice(
              "New message received. Sound cue placeholder."
            );
            window.setTimeout(() => setNotificationNotice(""), 3000);
          }

          void loadMessages().catch(() => {
            setErrorMessage("A new message arrived, but it could not be loaded.");
          });
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
  }, [chatId, loadMessages, profile?.id]);

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#efeae2] text-slate-950">
      <div className="mx-auto grid h-full w-full max-w-7xl overflow-hidden bg-white shadow-xl lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="hidden min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#f0f2f5] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  RogerThat
                </p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Chats
                </h1>
              </div>
              <Link
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                href="/"
              >
                Home
              </Link>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Search chats</span>
              <input
                className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search chats"
                type="search"
                value={searchQuery}
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
            {chats.length === 0 && !isLoading ? (
              <EmptyState
                description="Rooms and private chats appear here after setup."
                title="No chats"
              />
            ) : filteredChats.length === 0 && !isLoading ? (
              <EmptyState
                description="Try another room, private chat, or message keyword."
                title="No chats found"
              />
            ) : (
              filteredChats.map((item) => (
                <ChatListItem
                  chat={item}
                  hasLatestReport={
                    item.id === chatId
                      ? false
                      : hasUnreadReport(
                          messagesByChat[item.id],
                          readState[item.id]
                        )
                  }
                  isActive={item.id === chatId}
                  key={item.id}
                  lastMessage={lastMessagesByChat[item.id]}
                  unreadCount={
                    item.id === chatId
                      ? 0
                      : getUnreadCount(messagesByChat[item.id], readState[item.id])
                  }
                />
              ))
            )}
          </div>
        </aside>

        <section className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#efeae2]">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-[#f0f2f5] px-3 sm:min-h-16 sm:gap-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-semibold text-slate-700 lg:hidden"
                href="/chats"
              >
                ←
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 sm:text-base">
                  {getChatTitle(chat)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {(chat?.chat_members ?? []).length} participants
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
                {getChatTypeLabel(chat)}
              </span>
              <button
                className="min-h-9 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm lg:hidden"
                onClick={() => setIsInfoOpen(true)}
                type="button"
              >
                Info
              </button>
            </div>
          </header>

          {errorMessage ? (
            <p className="m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {notificationNotice ? (
            <p
              aria-live="polite"
              className="mx-3 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
            >
              {notificationNotice}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 py-3 scroll-smooth sm:px-6 sm:py-4">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading messages...</p>
            ) : messages.length === 0 ? (
              <EmptyState
                description="Send the first chat message, report message, or file."
                title="No messages yet"
              />
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === profile?.id;
                const isReport = isReportMessage(message);
                const messageAttachments = attachmentsByMessage[message.id] ?? [];

                return (
                  <article
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    id={`message-${message.id}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[92%] overflow-hidden rounded-lg px-3 py-2 text-sm shadow-sm sm:max-w-[70%] ${
                        isOwnMessage
                          ? "rounded-br-sm bg-[#d9fdd3]"
                          : "rounded-bl-sm bg-white"
                      }`}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {isReport ? (
                          <>
                            <span className="font-semibold text-slate-800">
                              {getReportSenderLabel(message)}
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-800">
                              Report
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800">
                              {getSenderName(message)}
                            </span>
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                              {getRoleLabel(message.profiles?.role)}
                            </span>
                          </>
                        )}
                        {isReport ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-800">
                            {getRoleLabel(message.profiles?.role)}
                          </span>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-[15px] leading-6">
                        {getMessageText(message)}
                      </p>
                      {messageAttachments.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                          {messageAttachments.map((attachment) => (
                            <AttachmentCard
                              attachment={attachment}
                              key={attachment.id}
                            />
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-1 text-right text-[11px] text-slate-500">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <form
            className="shrink-0 border-t border-slate-200 bg-[#f0f2f5] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:p-3"
            onSubmit={handleSendMessage}
          >
            {selectedFile ? (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700">
                <span className="truncate font-medium">
                  {selectedFile.name} · {formatFileSize(selectedFile.size)}
                </span>
                <button
                  className="shrink-0 font-semibold text-emerald-700"
                  onClick={clearSelectedFile}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <div className="grid gap-2 sm:flex sm:items-end">
              <div className="flex items-center gap-2 sm:contents">
                <button
                  aria-label="Emoji placeholder"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl text-slate-600 shadow-sm transition hover:bg-slate-50"
                  title="Emoji placeholder"
                  type="button"
                >
                  ☺
                </button>
                <label
                  className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  title="Upload image"
                >
                  <span aria-hidden="true">IMG</span>
                  <span className="sr-only">Upload image</span>
                  <input
                    accept={imageAttachmentAccept}
                    className="sr-only"
                    onChange={handleFileChange}
                    ref={imageInputRef}
                    type="file"
                  />
                </label>
                <label
                  className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  title="Upload file"
                >
                  <span aria-hidden="true">FILE</span>
                  <span className="sr-only">Upload file</span>
                  <input
                    accept={messageAttachmentAccept}
                    className="sr-only"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    type="file"
                  />
                </label>
                <button
                  aria-pressed={messageType === "REPORT"}
                  className={`h-11 shrink-0 rounded-full px-3 text-xs font-semibold shadow-sm transition ${
                    messageType === "REPORT"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() =>
                    setMessageType((current) =>
                      current === "REPORT" ? "CHAT" : "REPORT"
                    )
                  }
                  title="Toggle report message"
                  type="button"
                >
                  Report
                </button>
              </div>
              <div className="flex min-w-0 items-end gap-2 sm:flex-1">
                <div className="flex min-w-0 flex-1 items-end rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <textarea
                    className="max-h-24 min-h-7 flex-1 resize-none bg-transparent text-[15px] outline-none sm:max-h-28"
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={
                      messageType === "REPORT"
                        ? "Write a report..."
                        : "Type a message"
                    }
                    rows={1}
                    value={content}
                  />
                </div>
                <button
                  className="h-11 shrink-0 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm disabled:bg-slate-400 sm:px-5"
                  disabled={isSending || (!content.trim() && !selectedFile)}
                  type="submit"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="hidden border-l border-slate-200 bg-white lg:block">
          <ChatInfoPanel
            chat={chat}
            reportMessages={reportMessages}
            sharedFiles={sharedFiles}
            sharedImages={sharedImages}
          />
        </aside>
      </div>

      {isInfoOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <button
            aria-label="Close chat info"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setIsInfoOpen(false)}
            type="button"
          />
          <aside className="absolute right-0 top-0 h-full w-[min(24rem,92vw)] shadow-2xl">
            <ChatInfoPanel
              chat={chat}
              onClose={() => setIsInfoOpen(false)}
              reportMessages={reportMessages}
              sharedFiles={sharedFiles}
              sharedImages={sharedImages}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
