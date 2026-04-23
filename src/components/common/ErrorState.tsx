import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Đã xảy ra lỗi",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Alert
      variant="destructive"
      className={className}
    >
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onRetry}
          >
            <RotateCw className="mr-1 h-3 w-3" />
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ErrorState;
