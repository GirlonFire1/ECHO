import { useState } from "react";
import TransferOwnershipModal from "../TransferOwnershipModal";
import { Button } from "@/components/ui/button";

export default function TransferOwnershipModalExample() {
  const [open, setOpen] = useState(false);

  const members = [
    { id: "1", username: "Alice" },
    { id: "2", username: "Bob" },
    { id: "3", username: "Charlie" },
  ];

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Transfer Ownership</Button>
      <TransferOwnershipModal
        open={open}
        onOpenChange={setOpen}
        members={members}
        onTransfer={(id) => console.log("Transfer to:", id)}
      />
    </div>
  );
}
