"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface ErrorDisplayProps {
  error: Error | string | null;
}

function getErrorMessage(error: Error | string | null): string {
  if (!error) {
    return "An unknown error occurred";
  }

  if (typeof error === "string") {
    return error;
  }

  const message = error.message || "An error occurred";
  if (message.includes("Network error") || message.includes("fetch")) {
    return "Unable to connect to the API. Please check your connection.";
  }
  if (message.includes("404")) {
    return "The requested endpoint was not found.";
  }
  if (message.includes("403")) {
    return "Access denied. This endpoint may not be available.";
  }
  if (message.includes("500")) {
    return "Server error. Please try again later.";
  }

  return message;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const detailsText = useMemo(() => {
    if (!error || typeof error === "string") return null;
    return error.message
      ? JSON.stringify({ message: error.message }, null, 2)
      : null;
  }, [error]);

  if (!error) {
    return null;
  }

  const errorMessage = getErrorMessage(error);

  return (
    <Alert variant="destructive" className="max-w-4xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {errorMessage}
        {detailsText && (
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="ml-2 underline text-sm"
            aria-label={
              showDetails ? "Hide error details" : "Show error details"
            }
            type="button"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
        )}
        {detailsText && showDetails && (
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-destructive/40 bg-black/20 p-2 text-xs text-foreground/90">
            {detailsText}
          </pre>
        )}
      </AlertDescription>
    </Alert>
  );
}
