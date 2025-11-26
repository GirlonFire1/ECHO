import FileUploadProgress from "../FileUploadProgress";

export default function FileUploadProgressExample() {
  return (
    <div className="bg-background p-6 max-w-2xl">
      <FileUploadProgress
        fileName="vacation-photo.jpg"
        fileSize="2.4 MB"
        progress={65}
        onCancel={() => console.log("Cancel upload")}
      />
    </div>
  );
}
