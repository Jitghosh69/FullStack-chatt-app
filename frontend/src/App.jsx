import { useEffect, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

export const SocketContext = createContext(null);

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket, setOnlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const { setMessages } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNewMessage = (newMessage) => {
      const chatUserId =
        newMessage.senderId === authUser._id
          ? newMessage.receiverId
          : newMessage.senderId;

      setMessages((prevMessages) => {
        const userMessages = prevMessages[chatUserId] || [];

        // Check if the newMessage already exists in state to avoid duplicates
        const exists = userMessages.some((msg) => msg._id === newMessage._id);
        if (exists) return prevMessages; // Skip adding duplicate message

        return {
          ...prevMessages,
          [chatUserId]: [...userMessages, newMessage],
        };
      });
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("newMessage", handleNewMessage);
    socket.on("getOnlineUsers", handleOnlineUsers);
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("newMessage", handleNewMessage);
      socket.off("getOnlineUsers", handleOnlineUsers);
      socket.off("disconnect");
    };
  }, [socket, authUser, setMessages, setOnlineUsers]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socket}>
      <div data-theme={theme}>
        <Navbar />
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
        <Toaster />
      </div>
    </SocketContext.Provider>
  );
};

export default App;
