"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  getChatMessages,
  getMyChats,
  type Chat,
  type ChatMessage,
} from "@/lib/chats";
import {
  getUnreadCount,
  hasUnreadReport,
  readChatReadState,
  type ChatReadState,
} from "@/lib/chat-read-state";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { type ReactElement, useEffect, useMemo, useState } from "react";

function getChatTitle(chat: Chat): string {
  if (chat.chat_type === "CLASS_GROUP_CHAT" && chat.class_groups) {
    return `${chat.class_groups.code} Class Room`;
  }

  return chat.title?.trim() || "Private Chat";
}

function getProfileName(profile?: {
  full_name: string | null;
  email: string | null;
} | null): string {
  return profile?.full_name?.trim() || profile?.email?.trim() || "Member";
}

function getMemberName(member: NonNullable<Chat["chat_members"]>[number]): string {
  return getProfileName(member.profiles);
}

function getChatDisplayTitle(
  chat: Chat,
  currentProfile: UserProfile | null
): string {
  if (chat.chat_type === "CLASS_GROUP_CHAT") {
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

function getChatTypeLabel(chat: Chat): string {
  return chat.chat_type === "CLASS_GROUP_CHAT" ? "Room" : "Private";
}

function getMessagePreview(message?: ChatMessage): string {
  if (!message) {
    return "No messages yet";
  }

  const content = message.content.replace(/^\[REPORT\]\n/, "");
  return message.message_type === "REPORT" ? `Report: ${content}` : content;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
  lastMessage,
  unreadCount,
  hasLatestReport,
}: {
  chat: Chat;
  currentProfile: UserProfile | null;
  lastMessage?: ChatMessage;
  unreadCount: number;
  hasLatestReport: boolean;
}): ReactElement {
  const cappedUnreadCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const title = getChatDisplayTitle(chat, currentProfile);

  return (
    <Link
      className={`group mx-2 flex min-w-0 gap-3 rounded-2xl px-3 py-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm ${
        unreadCount > 0 ? "bg-emerald-50/80 ring-1 ring-emerald-100" : "bg-transparent"
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
        {title.charAt(0).toUpperCase() || "#"}
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

export default function ChatsPage(): ReactElement {
  const [chats, setChats] = useState<Chat[]>([]);
  const [lastMessagesByChat, setLastMessagesByChat] = useState<
    Record<string, ChatMessage | undefined>
  >({});
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [readState, setReadState] = useState<ChatReadState>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) =>
        chatMatchesSearch(chat, lastMessagesByChat[chat.id], searchQuery)
      ),
    [chats, lastMessagesByChat, searchQuery]
  );

  async function loadChats() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setReadState(readChatReadState());
      const [chatData, profileData] = await Promise.all([
        getMyChats(),
        getCurrentUserProfile(),
      ]);
      setChats(chatData);
      setProfile(profileData);

      const messageEntries = await Promise.all(
        chatData.map(async (chat) => {
          const messages = await getChatMessages(chat.id);
          return [chat.id, messages] as const;
        })
      );
      const nextMessagesByChat = Object.fromEntries(messageEntries);
      setMessagesByChat(nextMessagesByChat);
      setLastMessagesByChat(
        Object.fromEntries(
          messageEntries.map(([chatId, chatMessages]) => [
            chatId,
            chatMessages.at(-1),
          ])
        )
      );
    } catch {
      setErrorMessage("Could not load your chats. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadChats();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <main className="h-[100dvh] overflow-hidden bg-slate-950 text-slate-950">
      <div className="grid h-full w-full overflow-hidden bg-white lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_340px]">
        <aside className="flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-[#f6f8fb]">
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

          {errorMessage ? (
            <p className="m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain py-2 scroll-smooth">
            {isLoading ? (
              <p className="p-4 text-sm text-slate-600">Loading chats...</p>
            ) : chats.length === 0 ? (
              <EmptyState
                description="Rooms and private chats appear here after setup."
                title="No chats"
              />
            ) : filteredChats.length === 0 ? (
              <EmptyState
                description="Try another room, private chat, or message keyword."
                title="No chats found"
              />
            ) : (
              filteredChats.map((chat) => (
                <ChatListItem
                  chat={chat}
                  currentProfile={profile}
                  hasLatestReport={hasUnreadReport(
                    messagesByChat[chat.id],
                    readState[chat.id]
                  )}
                  key={chat.id}
                  lastMessage={lastMessagesByChat[chat.id]}
                  unreadCount={getUnreadCount(
                    messagesByChat[chat.id],
                    readState[chat.id]
                  )}
                />
              ))
            )}
          </div>
        </aside>

        <section className="hidden min-h-screen place-items-center bg-[#f4efe7] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.11),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.34)_25%,transparent_25%)] bg-[length:auto,28px_28px] lg:grid">
          <div className="max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[linear-gradient(135deg,#059669,#14b8a6)] text-2xl font-black text-white shadow-lg">
              R
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Select a chat
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open a room or private chat to send messages, report messages,
              and files.
            </p>
          </div>
        </section>

        <aside className="hidden border-l border-slate-200 bg-white xl:block">
          <div className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
            <p className="text-base font-black text-slate-950">
              Conversation info
            </p>
          </div>
          <div className="p-4 text-sm leading-6 text-slate-600">
            Participants, shared files, and shared images appear after you open
            a conversation.
          </div>
        </aside>
      </div>
    </main>
  );
}
