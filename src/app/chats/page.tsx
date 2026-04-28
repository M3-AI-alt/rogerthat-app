"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyChats, type Chat } from "@/lib/chats";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { type ReactElement, useEffect, useMemo, useState } from "react";

function getChatLabel(chat: Chat): string {
  return chat.title?.trim() || "Supervised chat";
}

function getChatTypeLabel(chat: Chat): string {
  if (chat.chat_type === "CLASS_GROUP_CHAT") {
    return "Class group chat";
  }

  if (chat.chat_type === "SUPERVISED_PRIVATE_CHAT") {
    return "Supervised private chat";
  }

  return "Chat";
}

export default function ChatsPage(): ReactElement {
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newMessageCounts, setNewMessageCounts] = useState<
    Record<string, number>
  >({});
  const [showNewMessageHint, setShowNewMessageHint] = useState(false);

  const totalNewMessages = useMemo(
    () =>
      Object.values(newMessageCounts).reduce(
        (total, chatCount) => total + chatCount,
        0
      ),
    [newMessageCounts]
  );

  async function loadChats() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      setChats(await getMyChats());
    } catch {
      setErrorMessage(
        "Could not load your conversations. Please try again."
      );
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

  useEffect(() => {
    if (chats.length === 0) {
      return;
    }

    const channels = chats.map((chat) =>
      supabase
        .channel(`chat-list-messages:${chat.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            filter: `chat_id=eq.${chat.id}`,
            schema: "public",
            table: "messages",
          },
          () => {
            setNewMessageCounts((currentCounts) => ({
              ...currentCounts,
              [chat.id]: (currentCounts[chat.id] ?? 0) + 1,
            }));
            setShowNewMessageHint(true);

            window.setTimeout(() => {
              setShowNewMessageHint(false);
            }, 2500);
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
    };
  }, [chats]);

  return (
    <AppShell>
      <PageNav />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Supervised chats
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          My chats
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Every teacher-parent conversation includes CEO supervision and visible
          Director oversight.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">
              Live chat updates
            </p>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {totalNewMessages} new messages
            </span>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-3">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              Supervised by CEO
            </p>
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
              Director included
            </p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700">
              No hidden private chat
            </p>
          </div>
          {showNewMessageHint ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              New message received.
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-3">
          {isLoading ? (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Loading chats...
            </p>
          ) : chats.length === 0 ? (
            <EmptyState
              description="Supervised conversations assigned to your account will appear here."
              title="No conversations yet"
            />
          ) : (
            chats.map((chat) => (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                href={`/chats/${chat.id}`}
                key={chat.id}
              >
                <p className="text-base font-semibold text-slate-950">
                  {getChatLabel(chat)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {getChatTypeLabel(chat)}
                </p>
                {chat.class_groups ? (
                  <p className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {chat.class_groups.code} - {chat.class_groups.name}
                  </p>
                ) : null}
                {(newMessageCounts[chat.id] ?? 0) > 0 ? (
                  <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {newMessageCounts[chat.id]} new
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
