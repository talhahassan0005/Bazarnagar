"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";
import { useGetCustomerMessagesQuery, useGetSellerMessagesQuery } from "@/store/apiSlice";
import { getChatSocket } from "@/lib/socket";
import type { ChatMessage, MessageSender } from "@/lib/types";

/** Message list + composer for one conversation. Shared by the customer chat
 * widget and the seller inbox — `role` decides which side "mine" is. */
export function ChatThread({ conversationId, role }: { conversationId: string; role: MessageSender }) {
  const customerQuery = useGetCustomerMessagesQuery(conversationId, { skip: role !== "customer" });
  const sellerQuery = useGetSellerMessagesQuery(conversationId, { skip: role !== "seller" });
  const { data: history, isLoading } = role === "customer" ? customerQuery : sellerQuery;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(history ?? []);
  }, [history]);

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;
    socket.emit("join", conversationId);

    const onNew = (msg: ChatMessage) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    getChatSocket()?.emit("message:send", { conversationId, text: trimmed });
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading && <p className="mt-4 text-center text-sm text-slate-400">Loading…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-400">Say hello 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderRole === role ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.senderRole === role ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
        />
        <Button type="submit" size="sm" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
