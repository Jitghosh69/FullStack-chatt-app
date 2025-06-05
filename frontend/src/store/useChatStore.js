import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

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

  getMessages: async (userId) => {
    const { messages } = get();
    // Check if messages are already loaded for the selected user
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

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      // Optimistic update (adds the new message without waiting for the server response)
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to send message");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Real-time message update method
  setMessages: (updateFn) => 
    set((state) => ({ messages: updateFn(state.messages) })),
}));
