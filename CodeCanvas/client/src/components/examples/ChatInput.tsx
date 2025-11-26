import ChatInput from "../ChatInput";

export default function ChatInputExample() {
  return (
    <div className="bg-background">
      <ChatInput
        onSendMessage={(msg) => console.log("Send:", msg)}
        onFileSelect={(file) => console.log("File:", file.name)}
      />
    </div>
  );
}
