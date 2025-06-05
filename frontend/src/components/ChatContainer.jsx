import { useEffect, useRef, useContext } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { SocketContext } from "../App";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    setMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const socket = useContext(SocketContext);
  const messageEndRef = useRef(null);

  // 📨 Fetch and subscribe to messages
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id); // Get message history

    if (socket) {
      // ✅ Listen for incoming real-time message
      socket.on("receiveMessage", (newMessage) => {
        // Only push if the message belongs to this conversation
        if (
          newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }
      });
    }

    // ✅ Clean up listener on unmount
    return () => {
      if (socket) socket.off("receiveMessage");
    };
  }, [selectedUser._id, socket, getMessages, setMessages]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
