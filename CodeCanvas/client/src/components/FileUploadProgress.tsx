import { Progress } from "@/components/ui/progress";
import { FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProgressProps {
  fileName: string;
  fileSize: string;
  progress: number;
  onCancel?: () => void;
}

export default function FileUploadProgress({
  fileName,
  fileSize,
  progress,
  onCancel,
}: FileUploadProgressProps) {
  return (
    <div
      className="max-w-md bg-card rounded-2xl p-3 ml-auto"
      data-testid="file-upload-progress"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
          <FileIcon className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">{fileSize}</p>
            </div>
            {onCancel && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 flex-shrink-0"
                onClick={onCancel}
                data-testid="button-cancel-upload"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-1">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-muted-foreground text-right">
              {progress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
