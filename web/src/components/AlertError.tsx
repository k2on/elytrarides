import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface AlertErrorProps {
    title?: string;
    body: string;
}
export default function AlertError({ title, body }: AlertErrorProps) {
    return <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || "Error"}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
    </Alert>
} 
