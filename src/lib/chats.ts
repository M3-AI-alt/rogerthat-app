import { supabase } from "@/lib/supabase/client";

export type ChatType = "CLASS_GROUP_CHAT" | "SUPERVISED_PRIVATE_CHAT";
export type ChatProfileRole = "CEO" | "DIRECTOR" | "TEACHER" | "PARENT";
export type MessageType = "CHAT" | "REPORT";

export type ChatMemberProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: ChatProfileRole | null;
};

export type ChatMember = {
  id: string;
  chat_id: string | null;
  profile_id: string | null;
  member_role: string | null;
  created_at: string;
  profiles?: ChatMemberProfile | null;
};

export type Chat = {
  id: string;
  class_id: string | null;
  chat_type: ChatType | null;
  title: string | null;
  created_by: string | null;
  parent_id: string | null;
  teacher_id: string | null;
  created_at: string;
  class_groups?: {
    id: string;
    name: string;
    code: string;
  } | null;
  chat_members?: ChatMember[];
};

export type ChatMessage = {
  id: string;
  chat_id: string | null;
  sender_id: string | null;
  content: string;
  created_at: string;
  profiles?: ChatMemberProfile | null;
};

type NestedProfileRow = ChatMemberProfile | ChatMemberProfile[] | null;

type ChatMemberRow = Omit<ChatMember, "profiles"> & {
  profiles?: NestedProfileRow;
};

type ChatRow = Omit<Chat, "class_groups" | "chat_members"> & {
  class_groups?: Chat["class_groups"] | Chat["class_groups"][];
  chat_members?: ChatMemberRow[];
};

type MessageRow = Omit<ChatMessage, "profiles"> & {
  profiles?: NestedProfileRow;
};

const chatSelect =
  "id, class_id, chat_type, title, created_by, parent_id, teacher_id, created_at, class_groups(id, name, code), chat_members(id, chat_id, profile_id, member_role, created_at, profiles(id, full_name, email, role))";

const messageSelect =
  "id, chat_id, sender_id, content, created_at, profiles(id, full_name, email, role)";

function normalizeProfile(profile: NestedProfileRow): ChatMemberProfile | null {
  return Array.isArray(profile) ? (profile[0] ?? null) : (profile ?? null);
}

function normalizeChat(row: ChatRow): Chat {
  return {
    ...row,
    class_groups: Array.isArray(row.class_groups)
      ? (row.class_groups[0] ?? null)
      : (row.class_groups ?? null),
    chat_members: (row.chat_members ?? []).map((member) => ({
      ...member,
      profiles: normalizeProfile(member.profiles ?? null),
    })),
  };
}

function normalizeMessage(row: MessageRow): ChatMessage {
  return {
    ...row,
    profiles: normalizeProfile(row.profiles ?? null),
  };
}

function removeDuplicateClassGroupChats(chats: Chat[]): Chat[] {
  const seenClassChatIds = new Set<string>();

  return chats.filter((chat) => {
    if (chat.chat_type !== "CLASS_GROUP_CHAT" || !chat.class_id) {
      return true;
    }

    if (seenClassChatIds.has(chat.class_id)) {
      return false;
    }

    seenClassChatIds.add(chat.class_id);
    return true;
  });
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be logged in to use chats.");
  }

  return user.id;
}

async function getApprovedCeoProfiles(): Promise<ChatMemberProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "CEO")
    .eq("approval_status", "APPROVED");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getApprovedDirectorProfiles(): Promise<ChatMemberProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "DIRECTOR")
    .eq("approval_status", "APPROVED");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getActiveParentIdsForClass(classId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_class_assignments")
    .select("parent_id")
    .eq("class_id", classId)
    .eq("status", "ACTIVE");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((assignment) => assignment.parent_id)
    .filter((parentId): parentId is string => Boolean(parentId));
}

async function getActiveTeacherIdsForClass(classId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("teacher_class_assignments")
    .select("teacher_id")
    .eq("class_id", classId)
    .eq("status", "ACTIVE");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((assignment) => assignment.teacher_id)
    .filter((teacherId): teacherId is string => Boolean(teacherId));
}

export async function getMyChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select(chatSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return removeDuplicateClassGroupChats(
    ((data ?? []) as ChatRow[]).map(normalizeChat)
  );
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chats")
    .select(chatSelect)
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeChat(data as ChatRow) : null;
}

export async function getClassGroupChatForClass(
  classId: string
): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chats")
    .select(chatSelect)
    .eq("class_id", classId)
    .eq("chat_type", "CLASS_GROUP_CHAT")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] ? normalizeChat(data[0] as ChatRow) : null;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(messageSelect)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as MessageRow[]).map(normalizeMessage);
}

export async function sendMessage(
  chatId: string,
  content: string
): Promise<ChatMessage> {
  const senderId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      content: content.trim(),
      sender_id: senderId,
    })
    .select(messageSelect)
    .single();

  if (error) {
    throw error;
  }

  return normalizeMessage(data as MessageRow);
}

async function insertMembers(
  chatId: string,
  members: Array<{ member_role: string; profile_id: string }>
): Promise<void> {
  const uniqueMembers = Array.from(
    new Map(members.map((member) => [member.profile_id, member])).values()
  );

  const { error } = await supabase.from("chat_members").upsert(
    uniqueMembers.map((member) => ({
      chat_id: chatId,
      member_role: member.member_role,
      profile_id: member.profile_id,
    })),
    { onConflict: "chat_id,profile_id" }
  );

  if (error) {
    throw error;
  }
}

export async function createClassGroupChat(classId: string): Promise<Chat> {
  const createdBy = await getCurrentUserId();
  const [
    existingChat,
    { data: classGroup, error: classError },
    ceos,
    directors,
    parentIds,
    teacherIds,
  ] = await Promise.all([
      getClassGroupChatForClass(classId),
      supabase
        .from("class_groups")
        .select("id, name, code")
        .eq("id", classId)
        .single(),
      getApprovedCeoProfiles(),
      getApprovedDirectorProfiles(),
      getActiveParentIdsForClass(classId),
      getActiveTeacherIdsForClass(classId),
    ]);

  if (classError) {
    throw classError;
  }

  if (existingChat) {
    await insertMembers(existingChat.id, [
      ...ceos.map((profile) => ({
        member_role: "CEO",
        profile_id: profile.id,
      })),
      ...directors.map((profile) => ({
        member_role: "DIRECTOR",
        profile_id: profile.id,
      })),
      ...teacherIds.map((teacherId) => ({
        member_role: "TEACHER",
        profile_id: teacherId,
      })),
      ...parentIds.map((parentId) => ({
        member_role: "PARENT",
        profile_id: parentId,
      })),
    ]);

    return (await getChatById(existingChat.id)) ?? existingChat;
  }

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({
      chat_type: "CLASS_GROUP_CHAT",
      class_id: classId,
      created_by: createdBy,
      title: `${classGroup.code} Class Room`,
    })
    .select(chatSelect)
    .single();

  if (error) {
    throw error;
  }

  await insertMembers(chat.id, [
    ...ceos.map((profile) => ({
      member_role: "CEO",
      profile_id: profile.id,
    })),
    ...directors.map((profile) => ({
      member_role: "DIRECTOR",
      profile_id: profile.id,
    })),
    ...teacherIds.map((teacherId) => ({
      member_role: "TEACHER",
      profile_id: teacherId,
    })),
    ...parentIds.map((parentId) => ({
      member_role: "PARENT",
      profile_id: parentId,
    })),
  ]);

  return (await getChatById(chat.id)) ?? normalizeChat(chat as ChatRow);
}

export async function createSupervisedPrivateChat(
  classId: string,
  teacherId: string,
  parentId: string,
  directorIds: string[]
): Promise<Chat> {
  if (directorIds.length === 0) {
    throw new Error("Choose at least one Director for this private chat.");
  }

  const createdBy = await getCurrentUserId();
  const [{ data: classGroup, error: classError }, ceos] = await Promise.all([
    supabase
      .from("class_groups")
      .select("id, name, code")
      .eq("id", classId)
      .single(),
    getApprovedCeoProfiles(),
  ]);

  if (classError) {
    throw classError;
  }

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({
      chat_type: "SUPERVISED_PRIVATE_CHAT",
      class_id: classId,
      created_by: createdBy,
      parent_id: parentId,
      teacher_id: teacherId,
      title: `${classGroup.code} Private Chat`,
    })
    .select(chatSelect)
    .single();

  if (error) {
    throw error;
  }

  await insertMembers(chat.id, [
    ...ceos.map((profile) => ({
      member_role: "CEO",
      profile_id: profile.id,
    })),
    ...directorIds.map((directorId) => ({
      member_role: "DIRECTOR",
      profile_id: directorId,
    })),
    { member_role: "TEACHER", profile_id: teacherId },
    { member_role: "PARENT", profile_id: parentId },
  ]);

  return (await getChatById(chat.id)) ?? normalizeChat(chat as ChatRow);
}
