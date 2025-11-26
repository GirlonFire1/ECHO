import { useState } from "react";
import ProfileSettingsModal from "../ProfileSettingsModal";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)} data-testid="button-open-profile">
        Open Profile Settings
      </Button>
      <ProfileSettingsModal
        open={open}
        onOpenChange={setOpen}
        currentUser={{
          username: "johndoe",
          email: "john@example.com",
          bio: "Software developer",
          phoneNumber: "+1234567890",
        }}
        onSave={(data) => console.log("Save profile:", data)}
        onAvatarUpload={(file) => console.log("Upload avatar:", file.name)}
      />
    </div>
  );
}
