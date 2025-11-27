import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchUsers } from "../api/users";
import { User } from "../types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface GlobalSearchProps {
  onSelectUser: (user: User) => void;
}

export default function GlobalSearch({ onSelectUser }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setLoading(true);
      try {
        const results = await searchUsers(term);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="p-2 border-b">
      <Input
        placeholder="Search users by email or phone..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        data-testid="global-search-input"
      />
      {loading && <p className="text-center text-sm text-muted-foreground mt-2">Searching...</p>}
      {searchResults.length > 0 && (
        <ScrollArea className="h-40 mt-2">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => onSelectUser(user)}
              data-testid={`search-result-user-${user.id}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
      {searchTerm.length > 2 && !loading && searchResults.length === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-2">No users found.</p>
      )}
    </div>
  );
}
