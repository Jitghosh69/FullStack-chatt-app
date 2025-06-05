import { useEffect, useState, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore"; // ✅ import chat store
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

// Create a context to pass the socket to other components
export const SocketContext = createContext(null);

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, setOnlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const { setMessages } = useChatStore(); // ✅ get setMessages from chat store
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser?._id) {
      const socketInstance = io("http://localhost:5002", {
        query: { userId: authUser._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("✅ Connected to socket.io:", socketInstance.id);
      });

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // ✅ Listen for real-time new messages
      socketInstance.on("newMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      socketInstance.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [authUser, setOnlineUsers, setMessages]);

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
