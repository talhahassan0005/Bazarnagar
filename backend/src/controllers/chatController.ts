import type { Request, Response } from "express";
import { z } from "zod";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Store } from "../models/Store";
import { Seller } from "../models/Seller";
import { Customer } from "../models/Customer";
import { ApiError, asyncHandler } from "../lib/helpers";

const startSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().optional(),
  productName: z.string().optional(),
});

/** POST /api/customer/conversations — get or start the chat with a store. */
export const startConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = startSchema.parse(req.body);
  const store = await Store.findById(data.storeId);
  if (!store) throw new ApiError(404, "Store not found");

  const conversation = await Conversation.findOneAndUpdate(
    { storeId: store._id, customerId: req.user!.id },
    {
      $setOnInsert: { storeId: store._id, customerId: req.user!.id },
      ...(data.productId ? { productId: data.productId, productName: data.productName } : {}),
    },
    { upsert: true, new: true }
  );
  res.status(201).json(conversation.toJSON());
});

/** GET /api/customer/conversations — the logged-in customer's chat threads. */
export const getMyConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await Conversation.find({ customerId: req.user!.id }).sort({
    lastMessageAt: -1,
    createdAt: -1,
  });
  const storeIds = [...new Set(conversations.map((c) => c.storeId.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).select("name slug logoUrl");
  const storeById = new Map(stores.map((s) => [s.id, s.toJSON()]));

  res.json(
    conversations.map((c) => ({ ...c.toJSON(), store: storeById.get(c.storeId.toString()) ?? null }))
  );
});

/** GET /api/seller/conversations — chat threads for the seller's store. */
export const getSellerConversations = asyncHandler(async (req: Request, res: Response) => {
  const seller = await Seller.findById(req.user!.id);
  if (!seller?.storeId) throw new ApiError(400, "Create your store profile first");

  const conversations = await Conversation.find({ storeId: seller.storeId }).sort({
    lastMessageAt: -1,
    createdAt: -1,
  });
  const customerIds = [...new Set(conversations.map((c) => c.customerId.toString()))];
  const customers = await Customer.find({ _id: { $in: customerIds } }).select("name phone");
  const customerById = new Map(customers.map((c) => [c.id, c.toJSON()]));

  res.json(
    conversations.map((c) => ({
      ...c.toJSON(),
      customer: customerById.get(c.customerId.toString()) ?? null,
    }))
  );
});

/** Resolve a conversation the current user (customer or seller) is allowed to see. */
export async function resolveConversationForUser(
  conversationId: string,
  user: { id: string; role: string }
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  if (user.role === "customer") {
    if (conversation.customerId.toString() !== user.id) throw new ApiError(403, "Not your conversation");
  } else if (user.role === "seller") {
    const seller = await Seller.findById(user.id);
    if (!seller?.storeId || seller.storeId.toString() !== conversation.storeId.toString()) {
      throw new ApiError(403, "Not your conversation");
    }
  } else {
    throw new ApiError(403, "Not allowed");
  }
  return conversation;
}

/** GET /:role/conversations/:id/messages — full history (ownership-checked). */
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.id!;
  await resolveConversationForUser(conversationId, req.user!);
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  res.json(messages.map((m) => m.toJSON()));
});

/** Persist a message + bump the conversation's preview — shared by REST and the socket handler. */
export async function persistMessage(conversationId: string, senderRole: "customer" | "seller", text: string) {
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) throw new ApiError(400, "Message can't be empty");

  const message = await Message.create({ conversationId, senderRole, text: trimmed });
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageText: trimmed,
    lastMessageAt: message.get("createdAt"),
  });
  return message;
}
