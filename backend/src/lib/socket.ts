import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { verifyToken } from "./jwt";
import { isAllowedOrigin } from "./corsOrigins";
import { resolveConversationForUser, persistMessage } from "../controllers/chatController";

interface ChatUser {
  id: string;
  role: "customer" | "seller";
}

function room(conversationId: string) {
  return `conv:${conversationId}`;
}

/** Real-time seller↔customer chat. One event on top of the REST history endpoints. */
export function initSocket(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin(origin, cb) {
        cb(null, !origin || isAllowedOrigin(origin));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyToken(token);
      if (payload.role !== "customer" && payload.role !== "seller") {
        return next(new Error("Not allowed"));
      }
      (socket.data as { user: ChatUser }).user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket.data as { user: ChatUser }).user;

    socket.on("join", async (conversationId: string) => {
      try {
        await resolveConversationForUser(conversationId, user);
        socket.join(room(conversationId));
      } catch {
        socket.emit("chat:error", "Cannot join that conversation");
      }
    });

    socket.on("message:send", async ({ conversationId, text }: { conversationId: string; text: string }) => {
      try {
        await resolveConversationForUser(conversationId, user);
        const message = await persistMessage(conversationId, user.role, text);
        io.to(room(conversationId)).emit("message:new", message.toJSON());
      } catch (err) {
        socket.emit("chat:error", err instanceof Error ? err.message : "Could not send message");
      }
    });
  });

  return io;
}
