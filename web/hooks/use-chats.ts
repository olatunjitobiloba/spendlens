"use client";

import { useSyncExternalStore } from "react";

import { CHATS_KEY } from "@/configs/insights";
import type { ChatRole } from "@/types/api";

// Conversations live in this browser only, like the history ai/chat.py
// expects the client to keep. Cleared with the other module keys on sign-out.

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Set when the user's message came from a voice note. */
  voiceSeconds?: number;
  /** Assistant answers that could not be grounded in the user's figures. */
  refusal?: boolean;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const EVENT = "spendlens:chats";
const EMPTY: Conversation[] = [];
const MAX_CONVERSATIONS = 50;

let cacheRaw: string | null = null;
let cache: Conversation[] = EMPTY;

function read(): Conversation[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CHATS_KEY);
  } catch {
    return cache;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Conversation[]) {
  const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
  cache = sorted;
  try {
    cacheRaw = JSON.stringify(sorted);
    localStorage.setItem(CHATS_KEY, cacheRaw);
  } catch {
    // Storage blocked or full: the chat still works for this visit.
    cacheRaw = null;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export const newId = () => crypto.randomUUID();

/** "Where did most of my money go this month?" -> "Where did most of my money go this…" */
export function titleFrom(text: string, max = 42) {
  const clean = text.replace(/\s+/g, " ").trim().replace(/[?.!]+$/, "");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export const chatStore = {
  get: () => read(),

  create(first: ChatMessage): Conversation {
    const convo: Conversation = {
      id: newId(),
      title: titleFrom(first.text),
      messages: [first],
      createdAt: first.createdAt,
      updatedAt: first.createdAt,
    };
    write([convo, ...read()]);
    return convo;
  },

  append(id: string, message: ChatMessage) {
    write(
      read().map((c) =>
        c.id === id ? { ...c, messages: [...c.messages, message], updatedAt: message.createdAt } : c,
      ),
    );
  },

  rename(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    write(read().map((c) => (c.id === id ? { ...c, title: t } : c)));
  },

  remove(id: string) {
    write(read().filter((c) => c.id !== id));
  },
};

export function useChats(): Conversation[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
