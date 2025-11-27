import MemberListItem from "../MemberListItem";

export default function MemberListItemExample() {
  return (
    <div className="w-70 bg-background p-4 space-y-2">
      <MemberListItem
        id="1"
        username="You"
        isAdmin={true}
        isOwner={true}
        isCurrentUser={true}
      />
      <MemberListItem
        id="2"
        username="Alice"
        isAdmin={true}
        isOwner={false}
        isCurrentUser={false}
        showActions={true}
        onPromote={(id) => console.log(`Promote ${id}`)}
        onDemote={(id) => console.log(`Demote ${id}`)}
        onRemove={(id) => console.log(`Remove ${id}`)}
      />
      <MemberListItem
        id="3"
        username="Bob"
        isAdmin={false}
        isOwner={false}
        isCurrentUser={false}
        showActions={true}
        onPromote={(id) => console.log(`Promote ${id}`)}
        onRemove={(id) => console.log(`Remove ${id}`)}
      />
    </div>
  );
}
