"use client";

import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Cancel01Icon, PencilEdit02Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";

import { Hint } from "@/components/ui/hint";
import { Icon } from "@/components/ui/icon";
import { chatStore, newId, useChats, type ChatMessage, type Conversation } from "@/hooks/use-chats";
import type { VoiceNote } from "@/hooks/use-voice-recorder";
import { ApiError, api } from "@/lib/api";
import type { ChatTurn } from "@/types/api";
import { Composer } from "./composer";
import { ConversationList } from "./conversation-list";
import { EmptyThread, MessageList, type Pending, type ThreadError } from "./message-list";

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-t3 hover:bg-foreground/[0.06] hover:text-foreground";

/** The last six turns, as ai/api.py ChatIn.history accepts. */
function historyOf(messages: ChatMessage[]): ChatTurn[] {
  return messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
}

function errorText(e: unknown, voice = false) {
  if (e instanceof ApiError) {
    if (e.kind === "asleep") return "SpendLens is not answering right now. It may be waking up.";
    if (e.kind === "validation") return voice ? "That voice note could not be read." : e.message;
    return e.message;
  }
  return "Something went wrong.";
}

export function ChatScreen() {
  const conversations = useChats();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [error, setError] = useState<(ThreadError & { convoId: string | null }) | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const retry = useRef<(() => void) | null>(null);

  const active: Conversation | null = conversations.find((c) => c.id === activeId) ?? null;
  const busy = pending !== null;

  async function ask(convoId: string, message: string, history: ChatTurn[]) {
    const ctrl = new AbortController();
    controller.current = ctrl;
    setError(null);
    setPending({ kind: "thinking" });
    setPendingFor(convoId);
    try {
      const reply = await api.chat({ message, history }, ctrl.signal);
      if (ctrl.signal.aborted) return; // fixture mode ignores the signal
      chatStore.append(convoId, {
        id: newId(),
        role: "assistant",
        text: reply.answer,
        refusal: reply.source === "refusal",
        createdAt: Date.now(),
      });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      retry.current = () => void ask(convoId, message, history);
      setError({ convoId, message: errorText(e), canRetry: true });
    } finally {
      if (controller.current === ctrl) {
        controller.current = null;
        setPending(null);
        setPendingFor(null);
      }
    }
  }

  function send(text: string, voiceSeconds?: number) {
    const message: ChatMessage = { id: newId(), role: "user", text, voiceSeconds, createdAt: Date.now() };
    const current = chatStore.get().find((c) => c.id === activeId);
    const history = current ? historyOf(current.messages) : [];
    let convoId: string;
    if (current) {
      chatStore.append(current.id, message);
      convoId = current.id;
    } else {
      convoId = chatStore.create(message).id;
      setActiveId(convoId);
    }
    void ask(convoId, text, history);
  }

  async function sendVoice(note: VoiceNote) {
    const ctrl = new AbortController();
    controller.current = ctrl;
    setError(null);
    setPending({ kind: "transcribing", seconds: note.seconds });
    setPendingFor(activeId);
    try {
      const { text } = await api.transcribe(note.blob, ctrl.signal);
      if (ctrl.signal.aborted) return;
      controller.current = null;
      const clean = text.trim().slice(0, 500);
      if (!clean) {
        setPending(null);
        setPendingFor(null);
        retry.current = null;
        setError({
          convoId: activeId,
          message: "No words came through in that voice note. Try again a little closer to the mic.",
          canRetry: false,
        });
        return;
      }
      send(clean, note.seconds);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      controller.current = null;
      setPending(null);
      setPendingFor(null);
      retry.current = () => void sendVoice(note);
      setError({ convoId: activeId, message: errorText(e, true), canRetry: true });
    }
  }

  function stop() {
    controller.current?.abort();
    controller.current = null;
    setPending(null);
    setPendingFor(null);
  }

  function select(id: string | null) {
    setActiveId(id);
    setDrawerOpen(false);
  }

  function remove(id: string) {
    if (id === pendingFor) stop();
    chatStore.remove(id);
    if (id === activeId) setActiveId(null);
    if (error?.convoId === id) setError(null);
  }

  const showPending = busy && pendingFor === activeId ? pending : null;
  const showError = error && error.convoId === activeId ? error : null;
  const messages = active?.messages ?? [];
  const isEmpty = messages.length === 0 && !showPending && !showError;

  const list = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      onSelect={select}
      onNew={() => select(null)}
      onDelete={remove}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <h1 className="sr-only">AI chat</h1>

      <aside className="hidden w-64 shrink-0 border-r border-line md:block">{list}</aside>

      <section aria-label={active?.title ?? "New chat"} className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger className={`${iconButton} md:hidden`} aria-label="Show chats">
              <Icon icon={SidebarLeftIcon} className="size-4.5" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] md:hidden" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-line bg-background shadow-2xl md:hidden"
              >
                <div className="flex h-14 items-center justify-between border-b border-line px-4">
                  <Dialog.Title className="text-[14px] font-[600]">Chats</Dialog.Title>
                  <Dialog.Close className={iconButton} aria-label="Close chats">
                    <Icon icon={Cancel01Icon} className="size-4.5" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1">{list}</div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <h2 className="min-w-0 flex-1 truncate text-[14.5px] font-[600] tracking-[-0.01em]">
            {active?.title ?? "New chat"}
          </h2>

          {active && (
            <Hint label="New chat" side="bottom">
              <button type="button" onClick={() => select(null)} aria-label="New chat" className={iconButton}>
                <Icon icon={PencilEdit02Icon} className="size-4.5" />
              </button>
            </Hint>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyThread onAsk={(t) => send(t)} />
          ) : (
            <MessageList
              messages={messages}
              pending={showPending}
              error={showError}
              onRetry={() => retry.current?.()}
            />
          )}
        </div>

        <Composer busy={busy} onSend={(t) => send(t)} onVoice={sendVoice} onStop={stop} />
      </section>
    </div>
  );
}
