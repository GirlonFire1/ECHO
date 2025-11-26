import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface RoomListItemProps {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function RoomListItem({
  name,
  lastMessage,
  unreadCount,
  isActive,
  onClick,
}: RoomListItemProps) {
  return (
    <button
      onClick={onClick}
      data-testid={`room-item-${name}`}
      className={`w-full flex items-center gap-3 p-3 hover-elevate active-elevate-2 rounded-md transition-colors ${
        isActive ? "bg-sidebar-accent" : ""
      }`}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium truncate">{name}</h3>
          {unreadCount && unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}
