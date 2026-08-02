"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useStartConversationMutation } from "@/store/apiSlice";
import { ChatThread } from "./ChatThread";

/** Floating "Chat with seller" button + panel — customer-only (login-gated). */
export function ChatWidget({
  storeId,
  storeName,
  productId,
  productName,
}: {
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
}) {
  const router = useRouter();
  const role = useAppSelector((s) => s.auth.role);
  const isCustomer = role === "customer";

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [startConversation, { isLoading }] = useStartConversationMutation();

  async function handleOpen() {
    if (!isCustomer) {
      router.push("/login");
      return;
    }
    setOpen(true);
    if (!conversationId) {
      const conv = await startConversation({ storeId, productId, productName }).unwrap();
      setConversationId(conv.id);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-brand-700"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Chat with {storeName}</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-800">{storeName}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {isLoading || !conversationId ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Connecting…</div>
            ) : (
              <ChatThread conversationId={conversationId} role="customer" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
