
import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

export function createSocket(accessToken) {
  return io(socketUrl, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
}