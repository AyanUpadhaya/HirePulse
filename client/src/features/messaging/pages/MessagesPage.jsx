import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} from "../api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  MessageSquare,
  Send,
  Briefcase,
  User,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

export function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = useSelector(selectCurrentUser);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);

  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, {
    pollingInterval: 10000,
  });

  const activeConversation = conversations.find((c) => c._id === conversationId);

  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId },
    {
      skip: !conversationId,
      pollingInterval: 5000,
    }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !conversationId) return;

    const textToSend = messageText.trim();
    setMessageText("");

    try {
      await sendMessage({ conversationId, text: textToSend }).unwrap();
      refetchMessages();
      refetchConversations();
    } catch (err) {
      toast({
        title: "Send Failed",
        description: err.data?.message || "Failed to send message.",
        variant: "destructive",
      });
      setMessageText(textToSend); // Restore unsent text
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv?.participants) return { name: "Participant" };
    return conv.participants.find((p) => p._id !== currentUser?._id) || conv.participants[0] || {};
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-10rem)] min-h-[550px] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <span>Direct Messages</span>
        </h1>
      </div>

      <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/10 ${
            conversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b font-semibold text-sm text-foreground flex items-center justify-between">
            <span>Conversations</span>
            <Badge variant="secondary" className="text-xs">
              {conversations.length}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {isConversationsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active conversations. Reach out to candidates or recruiters directly from job and applicant listings.
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = conv._id === conversationId;
                const lastMsg = conv.lastMessage;

                return (
                  <button
                    key={conv._id}
                    onClick={() => navigate(`/messages/${conv._id}`)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-muted/50 ${
                      isSelected ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {other.avatar ? (
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(other.name)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {other.name || "User"}
                        </span>
                        {lastMsg?.createdAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {conv.job?.title && (
                        <div className="text-[11px] text-primary truncate flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          <span>{conv.job.title}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {lastMsg?.text || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread */}
        <div
          className={`flex-1 flex flex-col ${
            !conversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {conversationId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between gap-3 bg-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/messages")}
                    className="md:hidden p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {getInitials(getOtherParticipant(activeConversation).name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {getOtherParticipant(activeConversation).name || "Conversation"}
                      </h3>
                      {activeConversation?.job?.title && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {activeConversation.job.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-muted/10">
                {isMessagesLoading && messages.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-48 rounded-xl" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Start this conversation by typing a message below.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      (msg.sender?._id || msg.sender) === currentUser?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words leading-relaxed ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-card text-foreground border rounded-bl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex gap-2">
                <Input
                  placeholder="Type a message (max 5,000 characters)..."
                  maxLength={5000}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  isLoading={isSending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground text-base">Select a conversation</h3>
              <p className="text-xs max-w-sm mt-1">
                Choose a conversation from the sidebar or reach out from a candidate or job posting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

