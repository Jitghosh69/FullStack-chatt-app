// src/store/useChatStore.jsx

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";  // Import auth store to get socket

export const useChatStore = create((set, get) => ({
  messages: {}, // Store messages by userId
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch users
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

  // Fetch messages by userId
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

  // Send a message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      const updatedMessages = {
        ...messages,
        [selectedUser._id]: [...(messages[selectedUser._id] || []), res.data],
      };
      set({ messages: updatedMessages });

      // Emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit("sendMessage", res.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to send message");
    }
  },

  // Set the selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Real-time message update method
  setMessages: (updateFn) =>
    set((state) => ({ messages: updateFn(state.messages) })),
}));
