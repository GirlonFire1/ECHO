import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RoomListItem from "@/components/RoomListItem";
import MessageBubble from "@/components/MessageBubble";
import MemberListItem from "@/components/MemberListItem";
import ChatInput from "@/components/ChatInput";
import CreateRoomModal from "@/components/CreateRoomModal";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import TransferOwnershipModal from "@/components/TransferOwnershipModal";
import FileUploadProgress from "@/components/FileUploadProgress";
import GlobalSearch from "@/components/GlobalSearch";
import {
  LogOut, Plus, Settings, Moon, Sun, Menu, X, Users,
  Copy, Check, MoreVertical, ChevronLeft, ChevronRight,
  Hash, Lock, Globe, Download, Trash2, AlertTriangle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getRooms, getRoom, createRoom, joinRoomByCode, createOrGetDM } from "../api/rooms";
import { getMessages, deleteMessage, clearRoomMessages } from "../api/messages";
import { uploadFile } from "../api/uploads";
import { searchUsers } from "../api/users";
import { User, Room, Message, RoomMember } from "../types";

export default function ChatPage() {
  const { user: currentUser, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTransferOwnershipOpen, setIsTransferOwnershipOpen] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false); // Default hidden
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [roomDescription, setRoomDescription] = useState("");
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const roomsData = await getRooms();
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);

          // Check for saved room in localStorage
          const savedRoomId = currentUser ? localStorage.getItem(`lastVisitedRoom_${currentUser.id}`) : null;
          if (savedRoomId) {
            const savedRoom = roomsData.find(r => r.id === savedRoomId);
            if (savedRoom) {
              await selectRoom(savedRoom.id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Auto-collapse sidebars on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
        setShowRoomInfo(false);
      } else {
        setSidebarCollapsed(false);
        // Don't auto-show room info on large screens, keep it hidden by default as requested
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const token = sessionStorage.getItem("token");
    const wsUrl = `ws://localhost:8000/ws/${selectedRoom.id}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected to room:", selectedRoom.id);
    };

    ws.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === "message") {
        // Add current user info to the message if it's from us
        const enrichedMessage = {
          ...messageData,
          user: messageData.user || (messageData.user_id === currentUser?.id ? currentUser : { username: 'Unknown' })
        };
        setMessages((prevMessages) => [...prevMessages, enrichedMessage]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [selectedRoom, currentUser]);

  const selectRoom = async (roomId: string) => {
    try {
      const roomData = await getRoom(roomId);
      setSelectedRoom(roomData);
      // Save to localStorage
      if (currentUser) {
        localStorage.setItem(`lastVisitedRoom_${currentUser.id}`, roomId);
      }
      const messagesData = await getMessages(roomId);
      if (Array.isArray(messagesData)) {
        // Backend returns newest first, so we reverse to show oldest first (chronological)
        setMessages([...messagesData].reverse());
      }
      setMembers(roomData.members || []);

      // Close sidebars on mobile when room is selected
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
        setShowRoomInfo(false);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && selectedRoom && currentUser) {
      const messageData = {
        type: "message",
        content: content,
        room_id: selectedRoom.id,
        user_id: currentUser.id,
        message_type: type,
        file_url: fileUrl
      };
      ws.current.send(JSON.stringify(messageData));
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedRoom) return;

    try {
      const result = await uploadFile(file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      // Pass the file URL as the content so it can be displayed/downloaded
      handleSendMessage(result.file_url, fileType);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  const handleCreateRoom = async (name: string, description: string, isTemporary: boolean, expiresAt: string | undefined) => {
    try {
      const roomData = {
        name,
        description,
        is_temporary: isTemporary,
        expires_at: expiresAt,
        is_private: false, // Default
      };
      const newRoom = await createRoom(roomData);
      setRooms([...rooms, newRoom]);
      setIsCreateRoomOpen(false);
      selectRoom(newRoom.id);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async (joinCode: string) => {
    try {
      await joinRoomByCode(joinCode);
      // Refresh rooms list
      const roomsData = await getRooms();
      setRooms(roomsData);

      // Find the joined room
      const joinedRoom = roomsData.find(r => r.join_code === joinCode);
      if (joinedRoom) {
        selectRoom(joinedRoom.id);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please check the code.");
    }
  };

  const handleCopyJoinCode = () => {
    if (selectedRoom?.join_code) {
      navigator.clipboard.writeText(selectedRoom.join_code);
      setCopiedJoinCode(true);
      setTimeout(() => setCopiedJoinCode(false), 2000);
    }
  };

  const handleOpenRoomSettings = () => {
    if (selectedRoom) {
      setRoomDescription(selectedRoom.description || "");
      setIsRoomSettingsOpen(true);
    }
  };

  const handleSaveRoomSettings = async () => {
    // TODO: Implement API call to update room description
    console.log("Saving room description:", roomDescription);
    setIsRoomSettingsOpen(false);
  };

  const handleRegenerateJoinCode = async () => {
    setIsRegeneratingCode(true);
    // TODO: Implement API call to regenerate join code
    console.log("Regenerating join code for room:", selectedRoom?.id);
    setTimeout(() => {
      setIsRegeneratingCode(false);
      setIsRoomSettingsOpen(false);
    }, 1000);
  };

  const handleLeaveRoom = async () => {
    // Implement leave room logic
    console.log("Leaving room:", selectedRoom?.id);
  };

  const handleUserClick = async (targetUserId: string) => {
    try {
      const dmRoom = await createOrGetDM(targetUserId);

      // Refresh rooms list to ensure the new DM appears
      const roomsData = await getRooms();
      setRooms(roomsData);

      // Select the DM room
      await selectRoom(dmRoom.id);

      // Clear search
      setSearchQuery("");
      setSearchResults([]);

    } catch (error) {
      console.error("Failed to create/get DM:", error);
      alert("Failed to start chat.");
    }
  };

  const handleDeleteMessage = async (messageId: string, deletionType: "for_me" | "for_everyone") => {
    try {
      await deleteMessage(messageId, deletionType);

      // Optimistic update
      if (deletionType === "for_me") {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      // For "for_everyone", the websocket will handle the update
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    }
  };

  const handleClearChat = () => {
    if (!selectedRoom) return;
    setIsClearChatOpen(true);
  };

  const confirmClearChat = async () => {
    if (!selectedRoom) return;
    try {
      await clearRoomMessages(selectedRoom.id);
      setMessages([]);
      setIsClearChatOpen(false);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden absolute inset-0 bg-black/50 z-20 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Left Sidebar - Rooms */}
      <div className={`${sidebarCollapsed ? '-translate-x-full w-0' : 'translate-x-0 w-72'} lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-0' : 'lg:w-72'} border-r border-slate-800 flex flex-col transition-all duration-300 absolute lg:relative z-30 h-full bg-slate-950 shadow-2xl lg:shadow-none overflow-hidden`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-lg">Chats</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsCreateRoomOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSidebarCollapsed(true)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-3">
          <Input
            placeholder="Search users..."
            className="bg-slate-900 border-slate-700 text-sm"
            value={searchQuery}
            onChange={async (e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 2) {
                try {
                  const users = await searchUsers(e.target.value);
                  setSearchResults(users);
                } catch (error) {
                  console.error("Failed to search users", error);
                }
              } else {
                setSearchResults([]);
              }
            }}
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {searchQuery ? (
              // Show User Search Results
              searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="p-3 rounded-lg hover:bg-slate-800/50 border border-transparent transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url ? `http://localhost:8000${user.avatar_url}` : undefined} />
                        <AvatarFallback className="bg-blue-600 text-xs">
                          {(user.username || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.username}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No users found
                </div>
              )
            ) : (
              // Show Rooms List
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => {
                    selectRoom(room.id);
                    // Optimistically mark as read
                    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, has_unread: false } : r));
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${selectedRoom?.id === room.id
                    ? 'bg-blue-600/20 border border-blue-500/50'
                    : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {room.is_private ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-green-400" />
                      )}
                      {room.has_unread && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-950"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className={`font-medium truncate ${room.has_unread ? 'text-white font-bold' : ''}`}>{room.name}</div>
                        {room.last_activity && (
                          <div className="text-[10px] text-slate-500">
                            {new Date(room.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <div className={`text-xs truncate ${room.has_unread ? 'text-slate-300' : 'text-slate-400'}`}>
                        {room.member_count || 0} members
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser?.avatar_url ? `http://localhost:8000${currentUser.avatar_url}` : undefined} />
              <AvatarFallback className="bg-blue-600 text-xs">
                {(currentUser?.username || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currentUser?.username}</div>
              <div className="text-xs text-slate-400">Online</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Collapsed Sidebar Trigger */}
      {sidebarCollapsed && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute left-2 top-4 z-10 lg:z-0"
          onClick={() => setSidebarCollapsed(false)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowRoomInfo(!showRoomInfo)}>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedRoom.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="font-semibold text-lg">{selectedRoom.name}</h1>
                  {!selectedRoom.is_private && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {members.length} members
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleCopyJoinCode}
                >
                  {copiedJoinCode ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{copiedJoinCode ? 'Copied!' : `Code: ${selectedRoom.join_code}`}</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleOpenRoomSettings}>
                      <Settings className="w-4 h-4 mr-2" />
                      Room Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 mr-2" />
                      Invite Members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearChat} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-400">
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isImage = msg.message_type === 'image' || (msg.content?.startsWith('/uploads/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content));
                    const isCurrentUser = msg.user_id === currentUser?.id;

                    // Check if previous message was from same user to group them
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isSequence = prevMsg && prevMsg.user_id === msg.user_id;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-1' : 'mt-4'}`}
                      >
                        <div className="w-full">
                          <MessageBubble
                            id={msg.id}
                            content={msg.content}
                            messageType={msg.message_type === 'image' ? 'IMAGE' : msg.message_type === 'video' ? 'VIDEO' : 'TEXT'}
                            senderName={msg.sender_name || msg.user?.username || 'Unknown'}
                            senderId={msg.user_id}
                            senderStatus={msg.user?.status}
                            timestamp={new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            isSent={isCurrentUser}
                            onDelete={handleDeleteMessage}
                          />
                        </div>
                      </div>

                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-800">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} onFileSelect={handleFileUpload} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a room to start chatting</p>
              <p className="text-sm mt-2">Or create a new room to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Room Info (Drawer style) */}
      {
        selectedRoom && showRoomInfo && !selectedRoom.is_private && (
          <div className="w-80 border-l border-slate-800 flex flex-col transition-all duration-300 bg-slate-950 absolute right-0 h-full z-20 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold">Room Info</h2>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowRoomInfo(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 text-center border-b border-slate-800">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-lg">
                {selectedRoom.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{selectedRoom.name}</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedRoom.description || "No description"}</p>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Members ({members.length})</h3>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 group transition-colors">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.user?.avatar_url ? `http://localhost:8000${member.user.avatar_url}` : undefined} />
                        <AvatarFallback className="bg-slate-700 text-sm">
                          {(member.user?.username || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{member.user?.username || "Unknown User"}</div>
                        {member.user?.status && (
                          <div className="text-xs text-slate-400 truncate">{member.user.status}</div>
                        )}
                        <div className="text-[10px] text-slate-500 capitalize">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )
      }

      {/* Modals */}
      <CreateRoomModal
        open={isCreateRoomOpen}
        onOpenChange={setIsCreateRoomOpen}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      {
        currentUser && (
          <ProfileSettingsModal
            open={isProfileOpen}
            onOpenChange={setIsProfileOpen}
            currentUser={currentUser}
            onProfileUpdate={(updatedUser) => {
              console.log("User updated:", updatedUser);
              // Ideally update the auth context here, but for now we just close the modal
              // and maybe the user will see updates on refresh or if we had a setUser in useAuth
            }}
          />
        )
      }

      {/* Room Settings Dialog */}
      <AlertDialog open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Room Settings</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Manage room details and configuration
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Room Description
              </label>
              <Textarea
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Enter room description..."
                className="bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">Join Code</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Regenerate if you want to revoke existing codes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateJoinCode}
                  disabled={isRegeneratingCode}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                >
                  {isRegeneratingCode ? "Generating..." : "Regenerate"}
                </Button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoomSettingsOpen(false)}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <AlertDialogAction
              onClick={handleSaveRoomSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Chat Confirmation Dialog */}
      <AlertDialog open={isClearChatOpen} onOpenChange={setIsClearChatOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Clear Chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to clear this chat? This will hide all messages for you. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearChatOpen(false)}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <AlertDialogAction
              onClick={confirmClearChat}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}