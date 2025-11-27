import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { User } from "../types";
import { updateUser, uploadAvatar, updateUserStatus, deleteAccount } from "../api/users";

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileSettingsModal({
  open,
  onOpenChange,
  currentUser,
  onProfileUpdate,
}: ProfileSettingsModalProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone_number || "");
  const [status, setStatus] = useState(currentUser.status || "");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(currentUser.username);
    setEmail(currentUser.email);
    setBio(currentUser.bio || "");
    setPhoneNumber(currentUser.phone_number || "");
    setStatus(currentUser.status || "");
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Now that UserUpdate schema includes status, we can update everything in one go
      const updatedUser = await updateUser({
        username,
        email,
        bio,
        phone_number: phoneNumber,
        status
      });
      onProfileUpdate(updatedUser);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const updatedUser = await uploadAvatar(file);
        onProfileUpdate(updatedUser);
      } catch (error) {
        console.error("Failed to upload avatar", error);
      }
      e.target.value = "";
    }
  };

  const handleDeleteClick = () => {
    if (currentUser.role === 'admin') {
      alert('Admins cannot delete their own account.');
      return;
    }
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      // Logout and redirect
      window.location.href = '/login';
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('Admins cannot delete their own account.');
      } else {
        console.error('Failed to delete account', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col" data-testid="modal-profile-settings">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-800 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit Profile</DialogTitle>
            <DialogDescription className="text-slate-400">
              Customize your appearance and personal details.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative group">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-slate-950 shadow-xl">
                  <AvatarImage
                    src={currentUser.avatar_url ? `http://localhost:8000${currentUser.avatar_url}` : undefined}
                    alt={username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {username ? username.substring(0, 2).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg border-4 border-slate-950 transition-all active:scale-95"
                  title="Upload new photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                data-testid="input-avatar-file"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium">Click the camera icon to upload</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-username" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</Label>
                <Input
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 h-10"
                  data-testid="input-profile-username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 h-10"
                  data-testid="input-profile-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-status" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                </div>
                <Input
                  id="profile-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="What's on your mind?"
                  className="pl-8 bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 h-10"
                  data-testid="input-profile-status"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bio</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio..."
                rows={3}
                className="bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none"
                data-testid="input-profile-bio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone (Optional)</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-900/50 border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 h-10"
                data-testid="input-profile-phone"
              />
            </div>

            <DialogFooter className="pt-4 mt-4 border-t border-slate-800 flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 flex items-center gap-2"
                data-testid="button-delete-account"
              >
                <Trash2 size={16} />
                Delete Account
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                  data-testid="button-cancel-profile"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                  data-testid="button-save-profile"
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>


      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-slate-950 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog >
  );
}
