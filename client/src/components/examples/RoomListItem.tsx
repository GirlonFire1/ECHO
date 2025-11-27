import RoomListItem from "../RoomListItem";

export default function RoomListItemExample() {
  return (
    <div className="w-70 bg-sidebar p-4 space-y-2">
      <RoomListItem
        id="1"
        name="General"
        lastMessage="Hey everyone!"
        unreadCount={3}
        onClick={() => console.log("Room clicked")}
      />
      <RoomListItem
        id="2"
        name="Project Team"
        lastMessage="Meeting at 3pm"
        isActive
        onClick={() => console.log("Room clicked")}
      />
      <RoomListItem
        id="3"
        name="Random"
        onClick={() => console.log("Room clicked")}
      />
    </div>
  );
}
