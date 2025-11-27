import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MessageBubbleProps {
  id: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "VIDEO";
  senderName: string;
  senderId: string;
  senderStatus?: string | null;
  timestamp: string;
  isSent: boolean;
  onDelete?: (id: string, deleteType: "for_me" | "for_everyone") => void;
}

export default function MessageBubble({
  id,
  content,
  messageType,
  senderName,
  senderStatus,
  timestamp,
  isSent,
  onDelete,
}: MessageBubbleProps) {
  // const [showActions, setShowActions] = useState(false); // Removed in favor of CSS group-hover

  const renderContent = () => {
    if (messageType === "IMAGE") {
      return (
        <img
          src={content.startsWith('/uploads/') ? `http://localhost:8000${content}` : content}
          alt="Shared image"
          className="max-w-xs rounded-lg cursor-pointer hover-elevate"
          onClick={() => console.log("Open image lightbox")}
          data-testid={`message-image-${id}`}
        />
      );
    }

    if (messageType === "VIDEO") {
      return (
        <video
          src={content}
          controls
          className="max-w-sm rounded-lg"
          data-testid={`message-video-${id}`}
        />
      );
    }

    return (
      <p className="text-base break-words" data-testid={`message-text-${id}`}>
        {content}
      </p>
    );
  };

  return (
    <div
      className={`flex gap-2 ${isSent ? "justify-end" : "justify-start"} group`}
    >
      {!isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {senderName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-md rounded-2xl p-3 ${isSent
          ? "bg-primary/10 rounded-br-sm ml-auto"
          : "bg-slate-800 rounded-bl-sm mr-auto text-slate-200"
          }`}
      >
        {!isSent && (
          <p className="text-xs font-medium mb-1 text-primary">{senderName}</p>
        )}
        {senderStatus && !isSent && (
          <p className="text-xs text-muted-foreground mb-1">{senderStatus}</p>
        )}
        {renderContent()}
        <div className="flex items-center justify-between gap-2 mt-1 min-h-[24px]">
          <p className="text-xs opacity-70">{timestamp}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  data-testid={`button-message-actions-${id}`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete?.(id, "for_me")}
                  data-testid={`button-delete-for-me-${id}`}
                >
                  Delete for me
                </DropdownMenuItem>
                {isSent && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(id, "for_everyone")}
                    className="text-destructive"
                    data-testid={`button-delete-for-everyone-${id}`}
                  >
                    Delete for everyone
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
