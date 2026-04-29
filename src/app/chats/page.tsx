"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  getChatMessages,
  getMyChats,
  type Chat,
  type ChatMessage,
} from "@/lib/chats";
import Link from "next/link";
import { type ReactElement, useEffect, useMemo, useState } from "react";

function getChatTitle(chat: Chat): string {
  if (chat.chat_type === "CLASS_GROUP_CHAT" && chat.class_groups) {
    return `${chat.class_groups.code} Class Room`;
  }

  return chat.title?.trim() || "Private Chat";
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
  lastMessage,
}: {
  chat: Chat;
  lastMessage?: ChatMessage;
}): ReactElement {
  return (
    <Link
      className="flex gap-3 border-b border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
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
          <span className="shrink-0 text-[11px] font-medium text-slate-500">
            {lastMessage ? formatTime(lastMessage.created_at) : "--"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
            {getChatTypeLabel(chat)}
          </span>
          <p className="truncate text-xs text-slate-500">
            {getMessagePreview(lastMessage)}
          </p>
          <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700">
            0
          </span>
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
      const chatData = await getMyChats();
      setChats(chatData);

      const latestEntries = await Promise.all(
        chatData.map(async (chat) => {
          const messages = await getChatMessages(chat.id);
          return [chat.id, messages.at(-1)] as const;
        })
      );
      setLastMessagesByChat(Object.fromEntries(latestEntries));
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
    <main className="min-h-screen bg-[#efeae2] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl bg-white shadow-xl lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="border-r border-slate-200 bg-white">
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

          {errorMessage ? (
            <p className="m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="max-h-[calc(100vh-125px)] overflow-y-auto">
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
                  key={chat.id}
                  lastMessage={lastMessagesByChat[chat.id]}
                />
              ))
            )}
          </div>
        </aside>

        <section className="hidden min-h-screen place-items-center bg-[#efeae2] lg:grid">
          <div className="max-w-sm text-center">
            <h2 className="text-2xl font-semibold text-slate-950">
              Select a chat
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open a class room or private chat to send messages, reports, and
              attachments.
            </p>
          </div>
        </section>

        <aside className="hidden border-l border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 bg-[#f0f2f5] px-4 py-4">
            <p className="text-base font-semibold text-slate-950">
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
