"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  createOrOpenDirectPrivateChat,
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
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
const emojiOptions = [
  "😀",
  "😊",
  "👍",
  "👏",
  "❤️",
  "🙏",
  "🎉",
  "⭐",
  "📌",
  "✅",
  "📚",
  "📝",
] as const;

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

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "M";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

function getChatDisplayTitle(
  chat: Chat | null,
  currentProfile?: UserProfile | null
): string {
  if (!chat || chat.chat_type === "CLASS_GROUP_CHAT") {
    return getChatTitle(chat);
  }

  const members = chat.chat_members ?? [];
  const peerMembers = members.filter((member) => {
    if (!member.profile_id || member.profile_id === currentProfile?.id) {
      return false;
    }

    return member.member_role !== "CEO" && member.member_role !== "DIRECTOR";
  });
  const visibleMembers = peerMembers.length > 0
    ? peerMembers
    : members.filter((member) => member.profile_id !== currentProfile?.id);
  const memberNames = visibleMembers.map(getMemberName).filter(Boolean);

  if (memberNames.length > 0) {
    return memberNames.slice(0, 2).join(", ");
  }

  return getChatTitle(chat);
}

function getChatTypeLabel(chat: Chat | null): string {
  return chat?.chat_type === "CLASS_GROUP_CHAT" ? "Room" : "Private";
}

function userIsChatMember(chat: Chat | null, profile: UserProfile | null): boolean {
  if (!chat || !profile) {
    return false;
  }

  return (chat.chat_members ?? []).some(
    (member) => member.profile_id === profile.id
  );
}

function canUserSendMessage(chat: Chat | null, profile: UserProfile | null): boolean {
  if (!chat || !profile || !profile.role || !userIsChatMember(chat, profile)) {
    return false;
  }

  if (profile.role === "CEO" || profile.role === "DIRECTOR") {
    return profile.approval_status === "APPROVED";
  }

  if (chat.chat_type === "CLASS_GROUP_CHAT") {
    if (profile.role === "TEACHER") {
      return profile.approval_status === "APPROVED";
    }

    return profile.role === "PARENT" && chat.parent_can_reply;
  }

  if (chat.chat_type === "SUPERVISED_PRIVATE_CHAT") {
    return (
      (profile.role === "TEACHER" &&
        profile.approval_status === "APPROVED" &&
        chat.teacher_id === profile.id) ||
      (profile.role === "PARENT" && chat.parent_id === profile.id)
    );
  }

  return false;
}

function getSendRestrictionMessage(
  chat: Chat | null,
  profile: UserProfile | null
): string {
  if (!chat || !profile) {
    return "Loading school-controlled communication settings...";
  }

  if (!userIsChatMember(chat, profile)) {
    return "You can read this only after the school adds you to the chat.";
  }

  if (chat.chat_type === "CLASS_GROUP_CHAT" && profile.role === "PARENT") {
    return "Parent replies are disabled for this room. You can read messages and contact the teacher, CEO, or Director in a private chat.";
  }

  return "Messaging is limited by school-controlled communication rules.";
}

function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getMemberActionHint(
  currentProfile: UserProfile | null,
  member: ChatMember
): string {
  if (!currentProfile || !member.profile_id || member.profile_id === currentProfile.id) {
    return "This is you";
  }

  if (currentProfile.role === "CEO" || currentProfile.role === "DIRECTOR") {
    return "Send message";
  }

  if (currentProfile.role === "TEACHER") {
    if (member.member_role === "PARENT") {
      return "Message assigned parent";
    }

    return "Send message";
  }

  if (currentProfile.role === "PARENT") {
    if (member.member_role === "TEACHER") {
      return "Message teacher";
    }

    if (member.member_role === "CEO" || member.member_role === "DIRECTOR") {
      return "Message school";
    }
  }

  return "School rules apply";
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

function formatDateLabel(value: string): string {
  const messageDate = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(messageDate);
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

function getFileIcon(attachment: MessageAttachment): string {
  const fileName = attachment.file_name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    return "PDF";
  }

  if ([".doc", ".docx"].some((extension) => fileName.endsWith(extension))) {
    return "DOC";
  }

  if (
    [".xls", ".xlsx", ".csv"].some((extension) => fileName.endsWith(extension))
  ) {
    return "XLS";
  }

  if ([".ppt", ".pptx"].some((extension) => fileName.endsWith(extension))) {
    return "PPT";
  }

  return "FILE";
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
  currentProfile,
  hasLatestReport,
  isActive,
  lastMessage,
  unreadCount,
}: {
  chat: Chat;
  currentProfile: UserProfile | null;
  hasLatestReport: boolean;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount: number;
}): ReactElement {
  const cappedUnreadCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const title = getChatDisplayTitle(chat, currentProfile);

  return (
    <Link
      className={`group mx-2 flex min-w-0 gap-3 rounded-2xl px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
        isActive
          ? "bg-white shadow-sm ring-1 ring-emerald-200"
          : unreadCount > 0
            ? "bg-emerald-50/80 ring-1 ring-emerald-100"
            : "bg-transparent hover:bg-white"
      }`}
      href={`/chats/${chat.id}`}
    >
      <div
        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black text-white shadow-sm ${
          chat.chat_type === "CLASS_GROUP_CHAT"
            ? "bg-[linear-gradient(135deg,#059669,#14b8a6)]"
            : "bg-[linear-gradient(135deg,#2563eb,#7c3aed)]"
        }`}
      >
        {getInitials(title)}
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-bold text-slate-950">
            {title}
          </p>
          <span
            className={`shrink-0 text-[11px] font-medium ${
              unreadCount > 0 ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {lastMessage ? formatTime(lastMessage.created_at) : "--"}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">
            {getChatTypeLabel(chat)}
          </span>
          {hasLatestReport ? (
            <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Report
            </span>
          ) : null}
          {unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
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
        className="group block max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300"
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
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            Open
          </span>
        </span>
      </a>
    );
  }

  return (
    <a
      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition hover:border-emerald-300"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
        {getFileIcon(attachment)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-800">
          {attachment.file_name}
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500">
          {formatFileSize(attachment.file_size)}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
  currentProfile,
  onClose,
  onStartPrivateChat,
  privateChatStartingMemberId,
  reportMessages,
  sharedFiles,
  sharedImages,
}: {
  chat: Chat | null;
  currentProfile: UserProfile | null;
  onClose?: () => void;
  onStartPrivateChat: (member: ChatMember) => Promise<void> | void;
  privateChatStartingMemberId: string | null;
  reportMessages: ChatMessage[];
  sharedFiles: MessageAttachment[];
  sharedImages: MessageAttachment[];
}): ReactElement {
  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <div className="border-b border-slate-200 bg-[#f0f2f5] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">
              {getChatDisplayTitle(chat, currentProfile)}
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

      <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain p-4">
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <h2 className="text-sm font-semibold text-emerald-950">
            Supervision
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            School-controlled communication is supervised for safety and
            quality. CEO and selected Directors can monitor rooms and private
            chats according to school rules.
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
              (chat?.chat_members ?? []).map((member) => {
                const isCurrentUser = member.profile_id === currentProfile?.id;
                const canOpenPrivateChat = !!member.profile_id && !isCurrentUser;
                const isOpeningPrivateChat =
                  privateChatStartingMemberId === member.id;

                return (
                  <button
                    className={`group relative rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
                      canOpenPrivateChat
                        ? "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/70 hover:shadow-md"
                        : "border-slate-200 bg-slate-50"
                    }`}
                    disabled={!canOpenPrivateChat || isOpeningPrivateChat}
                    key={member.id}
                    onClick={() => void onStartPrivateChat(member)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                        {getInitials(getMemberName(member))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {getMemberName(member)}
                        </span>
                        <span className="mt-1 block text-xs uppercase text-slate-500">
                          {getRoleLabel(member.member_role)}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                          canOpenPrivateChat
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-white text-slate-500 ring-1 ring-slate-200"
                        }`}
                      >
                        {isOpeningPrivateChat
                          ? "Opening"
                          : isCurrentUser
                            ? "You"
                            : "Chat"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {getMemberActionHint(currentProfile, member)}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {currentProfile?.role === "CEO" && chat?.class_id ? (
            <Link
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-emerald-300 hover:text-emerald-700"
              href={`${ROUTES.ceoRoomMembers}?classId=${chat.class_id}`}
              onClick={onClose}
            >
              Manage room members
            </Link>
          ) : null}
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
  const router = useRouter();
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
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [privateChatStartingMemberId, setPrivateChatStartingMemberId] =
    useState<string | null>(null);
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
  const canSendMessage = canUserSendMessage(chat, profile);

  function clearSelectedFile() {
    setSelectedFile(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAddEmoji(emoji: string) {
    setContent((currentContent) => `${currentContent}${emoji}`);
    setIsEmojiOpen(false);
  }

  async function handleStartPrivateChat(member: ChatMember) {
    if (!member.profile_id) {
      return;
    }

    setErrorMessage("");
    setPrivateChatStartingMemberId(member.id);

    try {
      const privateChat = await createOrOpenDirectPrivateChat(member.profile_id);
      setIsInfoOpen(false);
      router.push(`/chats/${privateChat.id}`);
    } catch {
      setErrorMessage(
        "Could not start this private chat. School communication rules may not allow this connection yet."
      );
    } finally {
      setPrivateChatStartingMemberId(null);
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
    <main className="h-[100dvh] overflow-hidden bg-slate-950 text-slate-950">
      <div className="grid h-full w-full overflow-hidden bg-white lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px] 2xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 min-w-0 flex-col border-r border-slate-200 bg-[#f6f8fb] lg:flex">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  RogerThat
                </p>
                <h1 className="text-xl font-black text-slate-950">
                  Chats
                </h1>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
                  href="/"
                >
                  Home
                </Link>
                <Link
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
                  href={ROUTES.contacts}
                >
                  Contacts
                </Link>
              </div>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Search chats</span>
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search chats"
                type="search"
                value={searchQuery}
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain py-2 scroll-smooth">
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
                  currentProfile={profile}
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

        <section className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#f4efe7]">
          <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur sm:gap-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 lg:hidden"
                href="/chats"
              >
                ←
              </Link>
              <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#059669,#14b8a6)] text-sm font-black text-white shadow-sm sm:grid">
                {chat ? getInitials(getChatDisplayTitle(chat, profile)) : "R"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-950">
                  {getChatDisplayTitle(chat, profile)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {(chat?.chat_members ?? []).length} participants ·
                  School-controlled communication
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100 sm:px-3 sm:text-xs">
                {getChatTypeLabel(chat)}
              </span>
              <button
                className="min-h-9 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white shadow-sm xl:hidden"
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

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.34)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.25)_25%,transparent_25%)] bg-[length:auto,28px_28px,28px_28px] px-2.5 py-3 scroll-smooth sm:px-6 sm:py-4">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading messages...</p>
            ) : messages.length === 0 ? (
              <EmptyState
                description="Send the first chat message, report message, or file."
                title="No messages yet"
              />
            ) : (
              messages.map((message, messageIndex) => {
                const isOwnMessage = message.sender_id === profile?.id;
                const isReport = isReportMessage(message);
                const messageAttachments = attachmentsByMessage[message.id] ?? [];
                const senderName = getSenderName(message);
                const previousMessage = messages[messageIndex - 1];
                const shouldShowDate =
                  !previousMessage ||
                  new Date(previousMessage.created_at).toDateString() !==
                    new Date(message.created_at).toDateString();

                return (
                  <div key={message.id}>
                    {shouldShowDate ? (
                      <div className="my-2 flex justify-center">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase text-slate-500 shadow-sm ring-1 ring-slate-200">
                          {formatDateLabel(message.created_at)}
                        </span>
                      </div>
                    ) : null}
                    <article
                      className={`animate-message-enter flex items-end gap-2 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                      id={`message-${message.id}`}
                    >
                      {!isOwnMessage ? (
                        <div className="mb-1 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-800 text-[11px] font-black text-white sm:grid">
                          {getInitials(senderName)}
                        </div>
                      ) : null}
                      <div
                        className={`relative max-w-[92%] overflow-hidden rounded-[1.35rem] px-3.5 py-2.5 text-sm shadow-sm ring-1 sm:max-w-[70%] ${
                          isOwnMessage
                            ? "rounded-br-md bg-[#d9fdd3] ring-emerald-200"
                            : "rounded-bl-md bg-white ring-slate-200"
                        } ${isReport ? "border-l-4 border-blue-500" : ""}`}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {isReport ? getReportSenderLabel(message) : senderName}
                          </span>
                          {isReport ? (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                              Report
                            </span>
                          ) : (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                              {getRoleLabel(message.profiles?.role)}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-950">
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
                        <p className="mt-1 text-right text-[11px] font-medium text-slate-500">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
          </div>

          {canSendMessage ? (
            <form
              className="relative shrink-0 border-t border-slate-200 bg-white/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:p-3"
              onSubmit={handleSendMessage}
            >
              {isEmojiOpen ? (
                <div className="absolute bottom-[calc(100%+0.5rem)] left-3 z-20 grid w-[min(22rem,calc(100vw-1.5rem))] grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                  {emojiOptions.map((emoji) => (
                    <button
                      className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:bg-emerald-50"
                      key={emoji}
                      onClick={() => handleAddEmoji(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedFile ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                  <span className="truncate font-medium">
                    {selectedFile.name} · {formatFileSize(selectedFile.size)}
                  </span>
                  <button
                    className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700"
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
                    aria-expanded={isEmojiOpen}
                    aria-label="Open emoji picker"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50"
                    onClick={() => setIsEmojiOpen((current) => !current)}
                    title="Emoji"
                    type="button"
                  >
                    🙂
                  </button>
                  <label
                    className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-[11px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50"
                    title="Upload image"
                  >
                    <span aria-hidden="true">🖼</span>
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
                    className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-base font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50"
                    title="Upload file"
                  >
                    <span aria-hidden="true">📎</span>
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
                    className={`h-11 shrink-0 rounded-full px-4 text-xs font-semibold shadow-sm transition ${
                      messageType === "REPORT"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50"
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
                  <div className="flex min-w-0 flex-1 items-end rounded-2xl bg-slate-50 px-4 py-2 shadow-inner ring-1 ring-slate-200 focus-within:bg-white focus-within:ring-emerald-200">
                    <textarea
                      className="max-h-24 min-h-7 flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-slate-400 sm:max-h-28"
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
                    className="h-11 shrink-0 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-400 sm:px-6"
                    disabled={isSending || (!content.trim() && !selectedFile)}
                    type="submit"
                  >
                    {isSending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="shrink-0 border-t border-slate-200 bg-[#f0f2f5] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-600">
                {getSendRestrictionMessage(chat, profile)}
              </p>
            </div>
          )}
        </section>

        <aside className="hidden min-w-0 border-l border-slate-200 bg-white xl:block">
          <ChatInfoPanel
            chat={chat}
            currentProfile={profile}
            onStartPrivateChat={(member) => void handleStartPrivateChat(member)}
            privateChatStartingMemberId={privateChatStartingMemberId}
            reportMessages={reportMessages}
            sharedFiles={sharedFiles}
            sharedImages={sharedImages}
          />
        </aside>
      </div>

      {isInfoOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 xl:hidden">
          <button
            aria-label="Close chat info"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setIsInfoOpen(false)}
            type="button"
          />
          <aside className="absolute right-0 top-0 h-full w-[min(24rem,92vw)] shadow-2xl">
            <ChatInfoPanel
              chat={chat}
              currentProfile={profile}
              onClose={() => setIsInfoOpen(false)}
              onStartPrivateChat={(member) => void handleStartPrivateChat(member)}
              privateChatStartingMemberId={privateChatStartingMemberId}
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
