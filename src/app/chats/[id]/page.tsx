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
} from "@/lib/chats";
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
  return chat?.title?.trim() || "Supervised chat";
}

function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getChatTypeLabel(chat: Chat | null): string {
  if (chat?.chat_type === "CLASS_GROUP_CHAT") {
    return "Class group";
  }

  if (chat?.chat_type === "SUPERVISED_PRIVATE_CHAT") {
    return "Private supervised";
  }

  return "Supervised";
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
      const [chatResult, messageResult, profileResult] = await Promise.all([
        getChatById(chatId),
        getChatMessages(chatId),
        getCurrentUserProfile(),
      ]);
      setChat(chatResult);
      setMessages(messageResult);
      setProfile(profileResult);

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

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!content.trim() || isSending) {
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
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-emerald-50">
                CEO supervised
              </span>
              <span className="rounded-full border border-blue-300/40 bg-blue-300/15 px-3 py-1 text-blue-50">
                Director visible
              </span>
            </div>
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
            Everyone listed here can see this conversation.
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
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {newMessageCount} new
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Messages update live while this page is open.
            </p>
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
                description="Start with a clear supervised message. CEO and Directors can see this conversation."
                title="No messages yet"
              />
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === profile?.id;

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
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                          {getRoleLabel(message.profiles?.role)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">
                        {message.content}
                      </p>
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
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Message
              <textarea
                className="min-h-16 resize-y rounded-lg border border-slate-300 bg-slate-50 p-4 text-base text-slate-950"
                onKeyDown={handleComposerKeyDown}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write a supervised message. Press Enter to send, Shift+Enter for a new line."
                value={content}
              />
            </label>
            <button
              className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
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
