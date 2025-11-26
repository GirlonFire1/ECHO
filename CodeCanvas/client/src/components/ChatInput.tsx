import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Smile } from "lucide-react";
import { useState, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onFileSelect,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative"
      data-testid="chat-input-form"
    >
      <div className="relative flex items-end gap-2 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-3 backdrop-blur-sm">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileChange}
          data-testid="input-file-hidden"
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleFileClick}
          disabled={disabled}
          className="h-9 w-9 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
          data-testid="button-attach-file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 min-h-[40px] max-h-32 bg-transparent border-0 resize-none text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="input-message"
          rows={1}
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
        >
          <Smile className="h-5 w-5" />
        </Button>

        <Button
          type="submit"
          size="icon"
          disabled={disabled || !message.trim()}
          className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
