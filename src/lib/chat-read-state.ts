import type { ChatMessage } from "@/lib/chats";

export type ChatReadState = Record<string, string>;

const READ_STATE_STORAGE_KEY = "rogerthat.chatReadState.v1";

function messageTime(message: ChatMessage): number {
  return new Date(message.created_at).getTime();
}

function readTime(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}

export function readChatReadState(): ChatReadState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(READ_STATE_STORAGE_KEY);
    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

export function writeChatReadState(readState: ChatReadState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    READ_STATE_STORAGE_KEY,
    JSON.stringify(readState)
  );
}

export function getUnreadCount(
  messages: ChatMessage[] | undefined,
  lastReadAt?: string
): number {
  if (!messages?.length) {
    return 0;
  }

  const lastReadTime = readTime(lastReadAt);
  return messages.filter((message) => messageTime(message) > lastReadTime)
    .length;
}

export function hasUnreadReport(
  messages: ChatMessage[] | undefined,
  lastReadAt?: string
): boolean {
  if (!messages?.length) {
    return false;
  }

  const lastReadTime = readTime(lastReadAt);
  return messages.some(
    (message) =>
      (message.message_type === "REPORT" ||
        message.content.startsWith("[REPORT]\n")) &&
      messageTime(message) > lastReadTime
  );
}

export function getLatestReadTimestamp(messages: ChatMessage[]): string {
  return messages.at(-1)?.created_at ?? new Date().toISOString();
}
