"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  addChatMember,
  createClassGroupChat,
  getClassGroupChatForClass,
  getRoomMemberProfiles,
  removeChatMember,
  type Chat,
  type ChatMember,
  type ChatMemberProfile,
  type ChatProfileRole,
} from "@/lib/chats";
import { getClassGroups, type ClassGroup } from "@/lib/classes";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from "react";

function getProfileLabel(profile: ChatMemberProfile): string {
  return profile.full_name?.trim() || profile.email?.trim() || profile.id;
}

function getMemberLabel(member: ChatMember): string {
  return member.profiles
    ? getProfileLabel(member.profiles)
    : member.profile_id || "Unknown member";
}

function getRoleLabel(role: string | null): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function CeoRoomMembersPage(): ReactElement {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [profiles, setProfiles] = useState<ChatMemberProfile[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [room, setRoom] = useState<Chat | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);

  const selectedClass = classes.find((classGroup) => classGroup.id === selectedClassId);
  const currentMembers = useMemo(
    () => room?.chat_members ?? [],
    [room?.chat_members]
  );
  const currentMemberIds = useMemo(
    () =>
      new Set(
        currentMembers
          .map((member) => member.profile_id)
          .filter((profileId): profileId is string => Boolean(profileId))
      ),
    [currentMembers]
  );
  const availableProfiles = profiles.filter(
    (profile) => !currentMemberIds.has(profile.id)
  );
  const selectedProfile = profiles.find(
    (profile) => profile.id === selectedProfileId
  );

  async function loadData(nextClassId?: string) {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [classResult, profileResult] = await Promise.all([
        getClassGroups(),
        getRoomMemberProfiles(),
      ]);
      const queryClassId =
        nextClassId ||
        new URLSearchParams(window.location.search).get("classId") ||
        "";
      const resolvedClassId =
        queryClassId && classResult.some((classGroup) => classGroup.id === queryClassId)
          ? queryClassId
          : classResult[0]?.id ?? "";

      setClasses(classResult);
      setProfiles(profileResult);
      setSelectedClassId(resolvedClassId);

      if (resolvedClassId) {
        setRoom(await getClassGroupChatForClass(resolvedClassId));
      } else {
        setRoom(null);
      }
    } catch {
      setErrorMessage("Could not load room members. Please check CEO access and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectClass(classId: string) {
    setSelectedClassId(classId);
    setSelectedProfileId("");
    setSuccessMessage("");
    setErrorMessage("");
    setRoom(classId ? await getClassGroupChatForClass(classId) : null);
  }

  async function handleCreateRoom() {
    if (!selectedClassId) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsCreatingRoom(true);

    try {
      const nextRoom = await createClassGroupChat(selectedClassId);
      setRoom(nextRoom);
      setSuccessMessage("Class room is ready. You can now manage members.");
    } catch {
      setErrorMessage("Could not create this room. Choose a class and try again.");
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!room || !selectedProfile?.role) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingMember(true);

    try {
      await addChatMember({
        chatId: room.id,
        profileId: selectedProfile.id,
        role: selectedProfile.role as ChatProfileRole,
      });
      setSelectedProfileId("");
      setRoom(await getClassGroupChatForClass(selectedClassId));
      setSuccessMessage(`${getProfileLabel(selectedProfile)} added to the room.`);
    } catch {
      setErrorMessage("Could not add this member. Please try again.");
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleRemoveMember(member: ChatMember) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingMember(true);

    try {
      await removeChatMember(member.id);
      setRoom(await getClassGroupChatForClass(selectedClassId));
      setSuccessMessage(`${getMemberLabel(member)} removed from the room.`);
    } catch {
      setErrorMessage("Could not remove this member. Please try again.");
    } finally {
      setIsSavingMember(false);
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
      <PageNav dashboardHref={ROUTES.ceoDashboard} />
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CEO / Rooms
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Manage Members
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Add CEO, Directors, Teachers, and Parents to class rooms. Room members
          can send messages, report messages, and attachments in the same chat.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
            href={ROUTES.ceoClasses}
          >
            Rooms
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950"
            href={ROUTES.ceoChats}
          >
            Private Chats
          </Link>
        </div>
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

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Room
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
              disabled={isLoading || classes.length === 0}
              onChange={(event) => void handleSelectClass(event.target.value)}
              value={selectedClassId}
            >
              {classes.length === 0 ? <option value="">No rooms yet</option> : null}
              {classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.code} - {classGroup.name}
                </option>
              ))}
            </select>
          </label>

          {isLoading ? (
            <p className="text-sm text-slate-600">Loading room members...</p>
          ) : classes.length === 0 ? (
            <EmptyState
              actionHref={ROUTES.ceoClasses}
              actionLabel="Create room"
              description="Create a room before adding members."
              title="No rooms yet"
            />
          ) : !room ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-950">
                {selectedClass
                  ? `${selectedClass.code} does not have a room yet.`
                  : "This class does not have a room yet."}
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Create the class room first, then add members.
              </p>
              <button
                className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isCreatingRoom}
                onClick={() => void handleCreateRoom()}
                type="button"
              >
                {isCreatingRoom ? "Creating..." : "Create room"}
              </button>
            </div>
          ) : (
            <>
              <form className="grid gap-3" onSubmit={handleAddMember}>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Add member
                  <select
                    className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950"
                    disabled={availableProfiles.length === 0 || isSavingMember}
                    onChange={(event) => setSelectedProfileId(event.target.value)}
                    required
                    value={selectedProfileId}
                  >
                    <option value="">Select member</option>
                    {availableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {getProfileLabel(profile)} - {getRoleLabel(profile.role)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={!selectedProfileId || isSavingMember}
                  type="submit"
                >
                  {isSavingMember ? "Saving..." : "Add to room"}
                </button>
              </form>

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Current members
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {selectedClass
                      ? `${selectedClass.code} - ${selectedClass.name}`
                      : "Class Room"}
                  </h2>
                </div>
                {currentMembers.length === 0 ? (
                  <EmptyState
                    description="Add CEO, Directors, Teachers, and Parents to make this room active."
                    title="No members yet"
                  />
                ) : (
                  currentMembers.map((member) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                      key={member.id}
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {getMemberLabel(member)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {member.profiles?.email || "No email"} ·{" "}
                          {getRoleLabel(member.member_role)}
                        </p>
                      </div>
                      <button
                        className="inline-flex min-h-10 items-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSavingMember}
                        onClick={() => void handleRemoveMember(member)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800"
                  href={`/chats/${room.id}`}
                >
                  Open Room
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
