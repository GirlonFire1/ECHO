import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface MemberListItemProps {
  id: string;
  username: string;
  isAdmin: boolean;
  isOwner: boolean;
  isCurrentUser: boolean;
  status?: string | null;
  showActions?: boolean;
  onPromote?: (userId: string) => void;
  onDemote?: (userId: string) => void;
  onRemove?: (userId: string) => void;
}

export default function MemberListItem({
  id,
  username,
  isAdmin,
  isOwner,
  isCurrentUser,
  status,
  showActions,
  onPromote,
  onDemote,
  onRemove,
}: MemberListItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-2 rounded-md hover-elevate"
      data-testid={`member-item-${id}`}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 h-2 w-2 bg-status-online rounded-full border-2 border-background" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {username}
            {isCurrentUser && (
              <span className="text-muted-foreground ml-1">(You)</span>
            )}
          </p>
          {isOwner && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Owner
            </Badge>
          )}
          {isAdmin && !isOwner && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Admin
            </Badge>
          )}
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>

      {showActions && !isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              data-testid={`button-member-actions-${id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isAdmin && (
              <DropdownMenuItem
                onClick={() => onPromote?.(id)}
                data-testid={`button-promote-${id}`}
              >
                Promote to Admin
              </DropdownMenuItem>
            )}
            {isAdmin && !isOwner && (
              <DropdownMenuItem
                onClick={() => onDemote?.(id)}
                data-testid={`button-demote-${id}`}
              >
                Demote to Member
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onRemove?.(id)}
              className="text-destructive"
              data-testid={`button-remove-${id}`}
            >
              Remove from Room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
