import { io, type Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

/** Lazily creates (or reuses) the chat socket, authenticated with the current JWT. */
export function getChatSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;

  if (socket && socket.auth && (socket.auth as { token?: string }).token === token) return socket;

  socket?.disconnect();
  socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}
