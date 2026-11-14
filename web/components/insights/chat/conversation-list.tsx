"use client";

import { useState } from "react";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { Icon } from "@/components/ui/icon";
import type { Conversation } from "@/hooks/use-chats";
import { cn } from "@/utils/cn";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-3">
        <Button variant="outline" className="w-full justify-start" onClick={onNew}>
          <Icon icon={PlusSignIcon} className="size-4" />
          New chat
        </Button>
      </div>

      <nav aria-label="Chats" className="min-h-0 flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <p className="px-2.5 pt-1 text-[13px] text-t4">Your chats will appear here.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? "page" : undefined}
                    title={c.title}
                    className={cn(
                      "flex h-9 w-full items-center rounded-lg pr-9 pl-2.5 text-left text-[13.5px] font-medium transition-colors",
                      active ? "bg-foreground/[0.07] text-foreground" : "text-t3 hover:bg-foreground/4 hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{c.title}</span>
                  </button>
                  <Hint label="Delete chat" side="right">
                    <button
                      type="button"
                      onClick={() => setConfirming(c)}
                      aria-label={`Delete “${c.title}”`}
                      className="absolute top-1/2 right-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-t4 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:opacity-100 max-lg:opacity-100"
                    >
                      <Icon icon={Delete02Icon} className="size-3.5" />
                    </button>
                  </Hint>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <AlertDialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent className="rounded-[1.25rem] border border-line-strong bg-panel ring-0 sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-[650]">Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px]">
              “{confirming?.title}” will be removed from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="rounded-b-[1.25rem] border-line bg-panel-raised/50">
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (confirming) onDelete(confirming.id);
                setConfirming(null);
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
