"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createSupervisedPrivateChat,
  getMyChats,
  type Chat,
  type ChatMember,
} from "@/lib/chats";
import { getCurrentUserProfile, type UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import {
  type FormEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useState,
} from "react";

type PrivateChatOption = {
  classId: string;
  classLabel: string;
  directors: ChatMember[];
  parent: ChatMember;
  teacher: ChatMember;
};

function getMemberName(member: ChatMember): string {
  return (
    member.profiles?.full_name?.trim() ||
    member.profiles?.email?.trim() ||
    member.profile_id ||
    "Member"
  );
}

function getDashboardHref(profile: UserProfile | null): string {
  if (profile?.role === "CEO") {
    return ROUTES.ceoDashboard;
  }

  if (profile?.role === "DIRECTOR") {
    return ROUTES.directorDashboard;
  }

  if (profile?.role === "TEACHER") {
    return ROUTES.teacherDashboard;
  }

  return ROUTES.parentDashboard;
}

function getClassLabel(chat: Chat): string {
  return chat.class_groups
    ? `${chat.class_groups.code} - ${chat.class_groups.name}`
    : chat.title || "Class Room";
}

function buildPrivateChatOptions(
  rooms: Chat[],
  profile: UserProfile | null
): PrivateChatOption[] {
  const options: PrivateChatOption[] = [];

  for (const room of rooms) {
    if (room.chat_type !== "CLASS_GROUP_CHAT" || !room.class_id) {
      continue;
    }

    const members = room.chat_members ?? [];
    const directors = members.filter(
      (member) => member.member_role === "DIRECTOR"
    );
    const parents = members.filter((member) => member.member_role === "PARENT");
    const teachers = members.filter(
      (member) => member.member_role === "TEACHER"
    );

    for (const teacher of teachers) {
      for (const parent of parents) {
        if (
          profile?.role === "TEACHER" &&
          teacher.profile_id !== profile.id
        ) {
          continue;
        }

        if (profile?.role === "PARENT" && parent.profile_id !== profile.id) {
          continue;
        }

        options.push({
          classId: room.class_id,
          classLabel: getClassLabel(room),
          directors,
          parent,
          teacher,
        });
      }
    }
  }

  return options;
}

export default function NewPrivateChatPage(): ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Chat[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState("");
  const [selectedDirectorIds, setSelectedDirectorIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdChatId, setCreatedChatId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const options = useMemo(
    () => buildPrivateChatOptions(rooms, profile),
    [profile, rooms]
  );
  const selectedOption =
    selectedOptionIndex === "" ? null : options[Number(selectedOptionIndex)];

  async function loadData() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [profileData, chatData] = await Promise.all([
        getCurrentUserProfile(),
        getMyChats(),
      ]);

      setProfile(profileData);
      setRooms(chatData.filter((chat) => chat.chat_type === "CLASS_GROUP_CHAT"));
    } catch {
      setErrorMessage("Could not load private chat options. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectOption(value: string) {
    setSelectedOptionIndex(value);
    setCreatedChatId("");
    setSuccessMessage("");

    const nextOption = value === "" ? null : options[Number(value)];
    setSelectedDirectorIds(
      (nextOption?.directors ?? [])
        .map((director) => director.profile_id)
        .filter((profileId): profileId is string => Boolean(profileId))
    );
  }

  async function handleCreatePrivateChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !selectedOption?.teacher.profile_id ||
      !selectedOption.parent.profile_id
    ) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setCreatedChatId("");
    setIsCreating(true);

    try {
      const chat = await createSupervisedPrivateChat(
        selectedOption.classId,
        selectedOption.teacher.profile_id,
        selectedOption.parent.profile_id,
        selectedDirectorIds
      );

      setCreatedChatId(chat.id);
      setSuccessMessage("Private chat is ready.");
    } catch {
      setErrorMessage(
        "Could not start this private chat. Make sure both users are in the same room."
      );
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav dashboardHref={getDashboardHref(profile)} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Private Chats
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Start Private Chat
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Start a school-controlled private chat with an allowed teacher-parent
          pair. CEO is included automatically for school safety.
        </p>
      </section>

      <section className="mt-8 grid gap-4">
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
          onSubmit={handleCreatePrivateChat}
        >
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading room members...</p>
          ) : options.length === 0 ? (
            <EmptyState
              actionHref={ROUTES.chats}
              actionLabel="Open chats"
              description="Private chats need an allowed teacher-parent pair in one of your class rooms."
              title="No private chat options yet"
            />
          ) : (
            <>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Members
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
                  onChange={(event) => handleSelectOption(event.target.value)}
                  required
                  value={selectedOptionIndex}
                >
                  <option value="">Select members</option>
                  {options.map((option, index) => (
                    <option key={`${option.classId}-${index}`} value={index}>
                      {option.classLabel}: {getMemberName(option.teacher)} and{" "}
                      {getMemberName(option.parent)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedOption ? (
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    School supervision
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    CEO is included automatically. Select Directors to include
                    in this private chat.
                  </p>
                  {selectedOption.directors.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No directors are in this room.
                    </p>
                  ) : (
                    selectedOption.directors.map((director) => (
                      <label
                        className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                        key={director.id}
                      >
                        <input
                          checked={
                            !!director.profile_id &&
                            selectedDirectorIds.includes(director.profile_id)
                          }
                          className="h-4 w-4"
                          disabled={!director.profile_id}
                          onChange={() => {
                            const directorId = director.profile_id;

                            if (!directorId) {
                              return;
                            }

                            setSelectedDirectorIds((currentIds) =>
                              currentIds.includes(directorId)
                                ? currentIds.filter(
                                    (id) => id !== directorId
                                  )
                                : [...currentIds, directorId]
                            );
                          }}
                          type="checkbox"
                        />
                        {getMemberName(director)}
                      </label>
                    ))
                  )}
                </div>
              ) : null}

              <button
                className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isCreating || !selectedOption}
                type="submit"
              >
                {isCreating ? "Starting..." : "Start Private Chat"}
              </button>
            </>
          )}
        </form>

        {createdChatId ? (
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-700 px-5 text-base font-semibold text-white"
            href={`/chats/${createdChatId}`}
          >
            Open Private Chat
          </Link>
        ) : null}
      </section>
    </AppShell>
  );
}
