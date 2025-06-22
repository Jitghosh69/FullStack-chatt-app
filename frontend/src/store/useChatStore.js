// src/store/useChatStore.js

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore"; // For socket access

export const useChatStore = create((set, get) => ({
  messages: {}, // userId => [messages]
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Get all users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get message history with a user
  getMessages: async (userId) => {
    const { messages } = get();
    if (messages[userId]) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: { ...messages, [userId]: res.data } });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ✅ Send message — socket will update UI, not local update
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Send via socket to trigger real-time update
      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit("sendMessage", res.data);
      }

      // ✅ DO NOT update local state here — to avoid double message bug

    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to send message");
    }
  },

  // Set which user is selected for chat
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Update messages — used by socket listener
  setMessages: (updateFn) =>
    set((state) => ({ messages: updateFn(state.messages) })),
}));
