"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyChats, type Chat } from "@/lib/chats";
import Link from "next/link";
import { type ReactElement, useEffect, useMemo, useState } from "react";

function getChatLabel(chat: Chat): string {
  if (chat.chat_type === "CLASS_GROUP_CHAT" && chat.class_groups) {
    return `${chat.class_groups.code} Class Room`;
  }

  if (chat.title?.trim()) {
    return chat.title.trim();
  }

  return chat.chat_type === "CLASS_GROUP_CHAT" ? "Class Room" : "Private Chat";
}

function getClassLabel(chat: Chat): string | null {
  if (!chat.class_groups) {
    return null;
  }

  return `${chat.class_groups.code} - ${chat.class_groups.name}`;
}

function ChatList({
  chats,
  emptyDescription,
  emptyTitle,
}: {
  chats: Chat[];
  emptyDescription: string;
  emptyTitle: string;
}): ReactElement {
  if (chats.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="grid gap-3">
      {chats.map((chat) => (
        <Link
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
          href={`/chats/${chat.id}`}
          key={chat.id}
        >
          <p className="text-base font-semibold text-slate-950">
            {getChatLabel(chat)}
          </p>
          {getClassLabel(chat) ? (
            <p className="mt-2 text-sm text-slate-600">{getClassLabel(chat)}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export default function ChatsPage(): ReactElement {
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const classRooms = useMemo(
    () => chats.filter((chat) => chat.chat_type === "CLASS_GROUP_CHAT"),
    [chats]
  );
  const privateChats = useMemo(
    () => chats.filter((chat) => chat.chat_type === "SUPERVISED_PRIVATE_CHAT"),
    [chats]
  );

  async function loadChats() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setChats(await getMyChats());
    } catch {
      setErrorMessage("Could not load your rooms and chats. Please try again.");
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
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Messages
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          My Rooms & Chats
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          All school communication is supervised for safety and quality.
        </p>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-8 grid gap-6">
        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Loading rooms and chats...
          </p>
        ) : (
          <>
            <section className="grid gap-3">
              <h2 className="text-xl font-semibold text-slate-950">
                Class Rooms
              </h2>
              <ChatList
                chats={classRooms}
                emptyDescription="Class rooms appear here after the school adds you to a class."
                emptyTitle="No class rooms yet"
              />
            </section>

            <section className="grid gap-3">
              <h2 className="text-xl font-semibold text-slate-950">
                Private Chats
              </h2>
              <ChatList
                chats={privateChats}
                emptyDescription="Private chats with a teacher or parent will appear here."
                emptyTitle="No private chats yet"
              />
            </section>
          </>
        )}
      </section>
    </AppShell>
  );
}
