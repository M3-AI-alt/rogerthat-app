"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createClassGroupChat,
  createSupervisedPrivateChat,
  getMyChats,
  type Chat,
} from "@/lib/chats";
import { getClassGroups, type ClassGroup } from "@/lib/classes";
import type { UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { type FormEvent, type ReactElement, useEffect, useState } from "react";

type StaffProfile = Pick<UserProfile, "id" | "full_name" | "email" | "role">;

function getProfileLabel(profile: StaffProfile): string {
  return profile.full_name?.trim() || profile.email?.trim() || profile.id;
}

function getChatTypeLabel(chat: Chat): string {
  return chat.chat_type === "CLASS_GROUP_CHAT"
    ? "Class group chat"
    : "Supervised private chat";
}

export default function CeoChatsPage(): ReactElement {
  const [chats, setChats] = useState<Chat[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [directors, setDirectors] = useState<StaffProfile[]>([]);
  const [parents, setParents] = useState<StaffProfile[]>([]);
  const [teachers, setTeachers] = useState<StaffProfile[]>([]);
  const [classChatClassId, setClassChatClassId] = useState("");
  const [privateChatClassId, setPrivateChatClassId] = useState("");
  const [privateChatParentId, setPrivateChatParentId] = useState("");
  const [privateChatTeacherId, setPrivateChatTeacherId] = useState("");
  const [privateChatDirectorIds, setPrivateChatDirectorIds] = useState<
    string[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingClassChat, setIsCreatingClassChat] = useState(false);
  const [isCreatingPrivateChat, setIsCreatingPrivateChat] = useState(false);

  async function loadChatData() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [chatResult, classResult, profileResult] = await Promise.all([
        getMyChats(),
        getClassGroups(),
        supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .in("role", ["DIRECTOR", "TEACHER", "PARENT"])
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      const profiles = (profileResult.data ?? []) as StaffProfile[];
      setChats(chatResult);
      setClasses(classResult);
      setDirectors(profiles.filter((profile) => profile.role === "DIRECTOR"));
      setParents(profiles.filter((profile) => profile.role === "PARENT"));
      setTeachers(profiles.filter((profile) => profile.role === "TEACHER"));
    } catch {
      setErrorMessage(
        "Could not load conversations. Please check your CEO access and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClassChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreatingClassChat(true);

    try {
      await createClassGroupChat(classChatClassId);
      setClassChatClassId("");
      setSuccessMessage("Class group chat created with CEO supervision.");
      await loadChatData();
    } catch {
      setErrorMessage(
        "Could not create class group chat. Choose a class and try again."
      );
    } finally {
      setIsCreatingClassChat(false);
    }
  }

  async function handleCreatePrivateChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreatingPrivateChat(true);

    try {
      await createSupervisedPrivateChat(
        privateChatClassId,
        privateChatTeacherId,
        privateChatParentId,
        privateChatDirectorIds
      );
      setPrivateChatClassId("");
      setPrivateChatParentId("");
      setPrivateChatTeacherId("");
      setPrivateChatDirectorIds([]);
      setSuccessMessage(
        "Supervised private chat created with CEO and Director included."
      );
      await loadChatData();
    } catch {
      setErrorMessage(
        "Could not create supervised private chat. Choose a class, teacher, parent, and at least one Director."
      );
    } finally {
      setIsCreatingPrivateChat(false);
    }
  }

  function toggleDirector(directorId: string) {
    setPrivateChatDirectorIds((currentIds) =>
      currentIds.includes(directorId)
        ? currentIds.filter((id) => id !== directorId)
        : [...currentIds, directorId]
    );
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadChatData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav dashboardHref={ROUTES.ceoDashboard} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Owner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Manage chats
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          CEO must be inside every class group chat and every supervised private
          chat. No hidden teacher-parent communication is allowed.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            {successMessage}
          </p>
        ) : null}

        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleCreateClassChat}
        >
          <div>
            <p className="text-base font-semibold text-slate-950">
              Create class group chat
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Adds CEO, Directors, and parents assigned to the selected class.
              Teacher assignment will come later.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setClassChatClassId(event.target.value)}
              required
              value={classChatClassId}
            >
              <option value="">Select class</option>
              {classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.code} - {classGroup.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isCreatingClassChat || isLoading}
            type="submit"
          >
            {isCreatingClassChat ? "Creating..." : "Create class group chat"}
          </button>
        </form>

        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleCreatePrivateChat}
        >
          <div>
            <p className="text-base font-semibold text-slate-950">
              Create supervised private chat
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              One teacher and one parent, with CEO and at least one Director
              visibly included.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Class
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setPrivateChatClassId(event.target.value)}
              required
              value={privateChatClassId}
            >
              <option value="">Select class</option>
              {classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.code} - {classGroup.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Teacher
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setPrivateChatTeacherId(event.target.value)}
              required
              value={privateChatTeacherId}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getProfileLabel(teacher)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Parent
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              onChange={(event) => setPrivateChatParentId(event.target.value)}
              required
              value={privateChatParentId}
            >
              <option value="">Select parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {getProfileLabel(parent)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <p className="text-sm font-medium text-slate-700">
              Director included
            </p>
            <div className="grid gap-2">
              {directors.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Add at least one approved Director profile before creating a
                  supervised private chat.
                </p>
              ) : (
                directors.map((director) => (
                  <label
                    className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700"
                    key={director.id}
                  >
                    <input
                      checked={privateChatDirectorIds.includes(director.id)}
                      className="h-4 w-4"
                      onChange={() => toggleDirector(director.id)}
                      type="checkbox"
                    />
                    {getProfileLabel(director)}
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isCreatingPrivateChat || isLoading}
            type="submit"
          >
            {isCreatingPrivateChat
              ? "Creating..."
              : "Create supervised private chat"}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All chats</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Supervised chat rooms
          </h2>
          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading chats...</p>
            ) : chats.length === 0 ? (
              <EmptyState
                description="Create a class group chat or supervised private chat to start the demo."
                title="No conversations yet"
              />
            ) : (
              chats.map((chat) => (
                <Link
                  className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300"
                  href={`/chats/${chat.id}`}
                  key={chat.id}
                >
                  <p className="text-base font-semibold text-slate-950">
                    {chat.title || "Supervised chat"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getChatTypeLabel(chat)}
                  </p>
                  {chat.class_groups ? (
                    <p className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {chat.class_groups.code} - {chat.class_groups.name}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
