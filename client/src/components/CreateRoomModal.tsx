import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type ModalStep = "initial" | "create" | "join";

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (name: string, description: string, isTemporary: boolean, expiresAt: string | undefined) => void;
  onJoinRoom: (code: string) => void;
}

export default function CreateRoomModal({
  open,
  onOpenChange,
  onCreateRoom,
  onJoinRoom,
}: CreateRoomModalProps) {
  const [step, setStep] = useState<ModalStep>("initial");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(name, description, isTemporary, isTemporary ? expiresAt : undefined);
      setName("");
      setDescription("");
      setIsTemporary(false);
      setExpiresAt("");
      onOpenChange(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinRoom(joinCode);
      setJoinCode("");
      onOpenChange(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => setStep("initial"), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="modal-create-room">
        <DialogHeader>
          <DialogTitle>
            {step === "initial" && "Rooms"}
            {step === "create" && "Create New Room"}
            {step === "join" && "Join a Room"}
          </DialogTitle>
          <DialogDescription>
            {step === "initial" && "Create a new room or join an existing one."}
            {step === "create" && "Create a new room to start chatting with your team."}
            {step === "join" && "Enter the 9-digit code to join a room."}
          </DialogDescription>
        </DialogHeader>

        {step === "initial" && (
          <div className="space-y-4 py-4">
            <Button onClick={() => setStep("create")} className="w-full">Create a Room</Button>
            <Button onClick={() => setStep("join")} className="w-full" variant="outline">Join a Room</Button>
          </div>
        )}

        {step === "create" && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter room name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-description">Description (Optional)</Label>
              <Textarea
                id="room-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter room description"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-temporary"
                checked={isTemporary}
                onCheckedChange={(checked) => setIsTemporary(!!checked)}
              />
              <Label htmlFor="is-temporary">Temporary Room</Label>
            </div>

            {isTemporary && (
              <div className="space-y-2">
                <Label htmlFor="expires-at">Expires At (YYYY-MM-DDTHH:MM)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required={isTemporary}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("initial")}>Back</Button>
              <Button type="submit">Create Room</Button>
            </DialogFooter>
          </form>
        )}
        
        {step === "join" && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">9-Digit Code</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter the code"
                maxLength={9}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("initial")}>Back</Button>
              <Button type="submit">Join Room</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
