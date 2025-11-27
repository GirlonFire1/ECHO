import MessageBubble from "../MessageBubble";

export default function MessageBubbleExample() {
  return (
    <div className="bg-background p-6 space-y-4 max-w-2xl">
      <MessageBubble
        id="1"
        content="Hey, how are you doing?"
        messageType="TEXT"
        senderName="Alice"
        senderId="user1"
        timestamp="10:30 AM"
        isSent={false}
        onDelete={(id, type) => console.log(`Delete ${id} ${type}`)}
      />
      <MessageBubble
        id="2"
        content="I'm doing great! Just working on the new feature."
        messageType="TEXT"
        senderName="You"
        senderId="user2"
        timestamp="10:32 AM"
        isSent={true}
        onDelete={(id, type) => console.log(`Delete ${id} ${type}`)}
      />
      <MessageBubble
        id="3"
        content="That's awesome! When will it be ready?"
        messageType="TEXT"
        senderName="Alice"
        senderId="user1"
        timestamp="10:33 AM"
        isSent={false}
        onDelete={(id, type) => console.log(`Delete ${id} ${type}`)}
      />
    </div>
  );
}
