"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { ChatThread } from "@/components/domain/ChatThread";
import { useGetSellerConversationsQuery } from "@/store/apiSlice";
import type { Conversation } from "@/lib/types";

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? "bg-brand-50" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-800">
          {conversation.customer?.name ?? "Customer"}
        </span>
        <span className="shrink-0 text-xs text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
      </div>
      {conversation.productName && (
        <span className="truncate text-xs text-brand-700">Re: {conversation.productName}</span>
      )}
      {conversation.lastMessageText && (
        <span className="truncate text-xs text-slate-500">{conversation.lastMessageText}</span>
      )}
    </button>
  );
}

export default function SellerMessagesPage() {
  const { data: conversations, isLoading } = useGetSellerConversationsQuery();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 text-sm text-slate-500">Chat with customers about their orders and questions.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Card className="h-[calc(100vh-14rem)] overflow-y-auto p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}
          {!isLoading && (!conversations || conversations.length === 0) && (
            <div className="p-4">
              <EmptyState
                icon={<MessageCircle className="h-6 w-6" />}
                title="No messages yet"
                description="Customer conversations will show up here."
              />
            </div>
          )}
          {conversations?.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              onClick={() => setActiveId(c.id)}
            />
          ))}
        </Card>

        <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden p-0">
          {active ? (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{active.customer?.name ?? "Customer"}</p>
                {active.customer?.phone && <p className="text-xs text-slate-400">{active.customer.phone}</p>}
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatThread conversationId={active.id} role="seller" />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Select a conversation to start chatting.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
