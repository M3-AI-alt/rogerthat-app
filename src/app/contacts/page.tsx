"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageNav } from "@/components/layout/PageNav";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createOrOpenDirectPrivateChat,
  getMyChats,
  type Chat,
  type ChatMemberProfile,
  type ChatProfileRole,
} from "@/lib/chats";
import { getCurrentUserProfile, getDashboardRoute, type UserProfile } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useMemo, useState } from "react";

type ContactStatus = "online" | "away" | "offline";

type Contact = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ChatProfileRole | null;
  sharedChatIds: Set<string>;
  sharedRoomLabels: Set<string>;
};

const roleFilters = ["ALL", "CEO", "DIRECTOR", "TEACHER", "PARENT"] as const;
type RoleFilter = (typeof roleFilters)[number];

const profileSelect = "id, full_name, email, role";

function getContactName(contact: Pick<Contact, "full_name" | "email">): string {
  return contact.full_name?.trim() || contact.email?.trim() || "Member";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "M";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRoleLabel(role: string | null): string {
  if (!role) {
    return "Member";
  }

  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getContactStatus(profileId: string): ContactStatus {
  const score = Array.from(profileId).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  if (score % 5 === 0) {
    return "online";
  }

  return score % 3 === 0 ? "away" : "offline";
}

function getStatusLabel(status: ContactStatus): string {
  if (status === "online") {
    return "Online";
  }

  return status === "away" ? "Away" : "Offline";
}

function getRoomLabel(chat: Chat): string {
  if (chat.class_groups) {
    return `${chat.class_groups.code} ${chat.class_groups.name}`;
  }

  return chat.title?.trim() || "Shared chat";
}

function upsertContact(
  contacts: Map<string, Contact>,
  profile: ChatMemberProfile,
  chat?: Chat
) {
  const current = contacts.get(profile.id) ?? {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    sharedChatIds: new Set<string>(),
    sharedRoomLabels: new Set<string>(),
  };

  if (chat) {
    current.sharedChatIds.add(chat.id);

    if (chat.chat_type === "CLASS_GROUP_CHAT") {
      current.sharedRoomLabels.add(getRoomLabel(chat));
    }
  }

  contacts.set(profile.id, current);
}

function buildContactsFromChats(
  chats: Chat[],
  profile: UserProfile | null
): Contact[] {
  const contacts = new Map<string, Contact>();

  for (const chat of chats) {
    for (const member of chat.chat_members ?? []) {
      if (!member.profiles || member.profile_id === profile?.id) {
        continue;
      }

      upsertContact(contacts, member.profiles, chat);
    }
  }

  return Array.from(contacts.values()).sort((first, second) =>
    getContactName(first).localeCompare(getContactName(second))
  );
}

async function getCeoDirectoryContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .in("role", ["CEO", "DIRECTOR", "TEACHER", "PARENT"])
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ChatMemberProfile[]).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    sharedChatIds: new Set<string>(),
    sharedRoomLabels: new Set<string>(),
  }));
}

function contactMatches(
  contact: Contact,
  roleFilter: RoleFilter,
  searchQuery: string
): boolean {
  if (roleFilter !== "ALL" && contact.role !== roleFilter) {
    return false;
  }

  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    getContactName(contact),
    contact.email ?? "",
    getRoleLabel(contact.role),
    ...Array.from(contact.sharedRoomLabels),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function ContactCard({
  contact,
  currentProfile,
  isOpening,
  onOpenChat,
}: {
  contact: Contact;
  currentProfile: UserProfile | null;
  isOpening: boolean;
  onOpenChat: (contact: Contact) => void;
}): ReactElement {
  const name = getContactName(contact);
  const status = getContactStatus(contact.id);
  const roomLabels = Array.from(contact.sharedRoomLabels);
  const canChat = contact.id !== currentProfile?.id;
  const statusClass =
    status === "online"
      ? "bg-emerald-500"
      : status === "away"
        ? "bg-amber-400"
        : "bg-slate-300";

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#059669,#14b8a6)] text-base font-black text-white shadow-sm">
          {getInitials(name)}
          <span
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${statusClass}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-black text-slate-950">
              {name}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">
              {getRoleLabel(contact.role)}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-500">
            {contact.email ?? "No email"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {getStatusLabel(status)}
            </span>
            {roomLabels.slice(0, 2).map((label) => (
              <span
                className="max-w-full truncate rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                key={label}
              >
                {label}
              </span>
            ))}
            {roomLabels.length > 2 ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                +{roomLabels.length - 2}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <button
        className="mt-4 min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canChat || isOpening}
        onClick={() => onOpenChat(contact)}
        type="button"
      >
        {isOpening ? "Opening..." : canChat ? "Message" : "This is you"}
      </button>
    </article>
  );
}

export default function ContactsPage(): ReactElement {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openingContactId, setOpeningContactId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const dashboardHref = profile ? getDashboardRoute(profile) : null;
  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        contactMatches(contact, roleFilter, searchQuery)
      ),
    [contacts, roleFilter, searchQuery]
  );

  async function loadContacts() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const [profileData, chatData] = await Promise.all([
        getCurrentUserProfile(),
        getMyChats(),
      ]);
      const contactsByChat = buildContactsFromChats(chatData, profileData);

      if (profileData?.role === "CEO") {
        const directoryContacts = await getCeoDirectoryContacts();
        const mergedContacts = new Map<string, Contact>();

        for (const contact of directoryContacts) {
          mergedContacts.set(contact.id, contact);
        }

        for (const contact of contactsByChat) {
          const existing = mergedContacts.get(contact.id);

          if (!existing) {
            mergedContacts.set(contact.id, contact);
            continue;
          }

          contact.sharedChatIds.forEach((id) => existing.sharedChatIds.add(id));
          contact.sharedRoomLabels.forEach((label) =>
            existing.sharedRoomLabels.add(label)
          );
        }

        setContacts(
          Array.from(mergedContacts.values())
            .filter((contact) => contact.id !== profileData.id)
            .sort((first, second) =>
              getContactName(first).localeCompare(getContactName(second))
            )
        );
      } else {
        setContacts(contactsByChat);
      }

      setProfile(profileData);
    } catch {
      setErrorMessage("Could not load contacts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenChat(contact: Contact) {
    setOpeningContactId(contact.id);
    setErrorMessage("");

    try {
      const chat = await createOrOpenDirectPrivateChat(contact.id);
      router.push(`/chats/${chat.id}`);
    } catch {
      setErrorMessage(
        "Could not open this private chat. School communication rules may not allow this connection yet."
      );
    } finally {
      setOpeningContactId(null);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadContacts();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <AppShell>
      <PageNav dashboardHref={dashboardHref ?? undefined} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Contacts
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            School colleagues
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Find teachers, parents, directors, and school leaders you can reach
            through supervised private chat.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
          href={ROUTES.chats}
        >
          Open chats
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label>
            <span className="sr-only">Search contacts</span>
            <input
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, role, email, or room"
              type="search"
              value={searchQuery}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {roleFilters.map((role) => (
              <button
                className={`min-h-10 rounded-xl px-3 text-xs font-black uppercase transition ${
                  roleFilter === role
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                key={role}
                onClick={() => setRoleFilter(role)}
                type="button"
              >
                {role === "ALL" ? "All" : getRoleLabel(role)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-6">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white"
                key={index}
              />
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            actionHref={ROUTES.chats}
            actionLabel="Open chats"
            description="Contacts appear after you share a room or private chat with other school members."
            title="No contacts found"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                contact={contact}
                currentProfile={profile}
                isOpening={openingContactId === contact.id}
                key={contact.id}
                onOpenChat={(selectedContact) => void handleOpenChat(selectedContact)}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
