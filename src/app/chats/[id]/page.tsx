"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import {
  getChatById,
  getChatMessages,
  sendMessage,
  type Chat,
  type ChatMember,
  type ChatMessage,
} from "@/lib/chats";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  type FormEvent,
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
  return chat?.title?.trim() || "Supervised chat";
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
      <div className="mt-2 grid gap-2">
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Not added yet.</p>
        ) : (
          members.map((member) => (
            <p
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showNewMessageHint, setShowNewMessageHint] = useState(false);

  const loadChat = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [chatResult, messageResult] = await Promise.all([
        getChatById(chatId),
        getChatMessages(chatId),
      ]);
      setChat(chatResult);
      setMessages(messageResult);

      if (!chatResult) {
        setErrorMessage("This chat was not found or you are not a member.");
      }
    } catch {
      setErrorMessage(
        "Could not load this chat. Make sure you are a chat member and the supervised chat SQL has been run."
      );
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setErrorMessage("");
    setIsSending(true);

    try {
      const message = await sendMessage(chatId, trimmedContent);
      setMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message]
      );
      setContent("");
    } catch {
      setErrorMessage("Could not send this message. Please try again.");
    } finally {
      setIsSending(false);
    }
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
          void getChatMessages(chatId).then(setMessages).catch(() => {
            setErrorMessage("A new message arrived, but it could not be loaded.");
          });

          window.setTimeout(() => {
            setShowNewMessageHint(false);
          }, 2500);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId]);

  return (
    <AppShell>
      <PageNav dashboardHref="/chats" dashboardLabel="My Chats" />
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Supervised chat room
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          {getChatTitle(chat)}
        </h1>
        {chat?.class_groups ? (
          <p className="mt-2 text-sm text-slate-600">
            {chat.class_groups.code} - {chat.class_groups.name}
          </p>
        ) : null}
        <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-3">
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
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-950">
            Participants
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

        <div className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-slate-950">
                Messages
              </p>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {newMessageCount} new
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Messages update live while this page is open.
            </p>
            {showNewMessageHint ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                New message received. Sound alert placeholder.
              </p>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No messages yet.
              </p>
            ) : (
              messages.map((message) => (
                <article
                  className="ml-auto max-w-[88%] rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:max-w-[72%]"
                  key={message.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {getSenderName(message)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {message.content}
                  </p>
                </article>
              ))
            )}
          </div>

          <form
            className="grid gap-3 border-t border-slate-200 p-4"
            onSubmit={handleSendMessage}
          >
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Message
              <textarea
                className="min-h-24 resize-y rounded-lg border border-slate-300 p-4 text-base text-slate-950"
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write a supervised message..."
                value={content}
              />
            </label>
            <button
              className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSending || !content.trim()}
              type="submit"
            >
              {isSending ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
