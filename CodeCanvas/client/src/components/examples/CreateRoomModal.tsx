import { useState } from "react";
import CreateRoomModal from "../CreateRoomModal";
import { Button } from "@/components/ui/button";

export default function CreateRoomModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)} data-testid="button-open-modal">
        Open Create Room Modal
      </Button>
      <CreateRoomModal
        open={open}
        onOpenChange={setOpen}
        onCreateRoom={(name, desc) => console.log("Create room:", name, desc)}
      />
    </div>
  );
}
