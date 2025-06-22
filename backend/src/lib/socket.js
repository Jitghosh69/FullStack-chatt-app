import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Map to store online users: userId -> socketId
const userSocketMap = {};

// Helper to get socket ID by userId
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Notify all clients about online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for new messages from clients
  socket.on("sendMessage", (message) => {
    const receiverSocketId = userSocketMap[message.receiverId];
    
    // Emit new message only to the receiver if connected
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    // Emit new message to sender as well (so they see their own message instantly)
    socket.emit("newMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // Remove user from online map
    if (userId) {
      delete userSocketMap[userId];
    }
    // Notify all clients about updated online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
