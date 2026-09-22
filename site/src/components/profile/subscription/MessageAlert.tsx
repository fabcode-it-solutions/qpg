import { cn } from "@/lib/utils/utils";
import { CheckIcon, XIcon } from "@/components/icons";
import { MessageState } from "./types";

interface MessageAlertProps {
  message: MessageState;
}

export default function MessageAlert({ message }: MessageAlertProps) {
  return (
    <div
      className={cn(
        "mb-6 p-4 rounded-xl border flex items-start gap-3",
        message.type === "success"
          ? "bg-(--color-gold)/10 border-(--color-gold)/30"
          : "bg-red-500/10 border-red-500/30"
      )}
    >
      {message.type === "success" ? (
        <CheckIcon
          size={20}
          className="text-(--color-gold) mt-0.5 flex-shrink-0"
        />
      ) : (
        <XIcon size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
      )}
      <p
        className={cn(
          "text-sm",
          message.type === "success"
            ? "text-(--color-gold)"
            : "text-red-400"
        )}
      >
        {message.text}
      </p>
    </div>
  );
}