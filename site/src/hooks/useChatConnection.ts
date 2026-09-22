import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { socketService } from "@/lib/services/socket.service";
import { useChatStore } from "@/stores/chat.store";

export function useChatConnection() {
  const { data: session } = useSession();
  const isInitializedRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    setConnectionState,
    setError,
    setTyping,
    handleMessageResponse,
    handleSessionLoaded,
    clearHistory,
    clearHistoryAndSendMessage,
  } = useChatStore();

  const connect = async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let currentUserId = session?.user?.id;
    let currentUserName = session?.user?.name || "User";

    // If user is not logged in, try to get a persistent anonymous ID from localStorage
    if (!currentUserId) {
      if (typeof window !== "undefined") {
        // Ensure localStorage is available
        let anonymousId = localStorage.getItem("anonymous_user_id");
        if (!anonymousId) {
          anonymousId = "uuidv4()";
          localStorage.setItem("anonymous_user_id", anonymousId);
        }
        currentUserId = anonymousId;
        currentUserName = "Guest";
      }
    }

    if (!currentUserId) {
      setError("Could not determine user ID");
      setConnectionState(false, false);
      isInitializedRef.current = false;
      return;
    }

    try {
      const connected = await socketService.connect();
      if (!connected) {
        setError("Failed to connect to chat service");
        setConnectionState(false, false);
        return;
      }

      const authenticated = await socketService.authenticate({
        userId: currentUserId,
        userName: currentUserName,
      });

      if (!authenticated) {
        setError("Authentication failed");
        setConnectionState(false, false);
        return;
      }

      setConnectionState(true, true);
      setError(null);

      setupEventListeners(currentUserId);

      // Always try to load session data after successful authentication
      try {
        const sessionData = await socketService.getSession();
        if (sessionData?.messages && sessionData.messages.length > 0) {
          handleSessionLoaded(sessionData);
        }
      } catch (sessionError) {
        // Session load failed, but connection is still valid
        console.warn("Failed to load session data:", sessionError);
      }
    } catch (err) {
      setError("Connection error");
      setConnectionState(false, false);
      isInitializedRef.current = false; // Allow retry
    }
  };

  const setupEventListeners = (userId: string) => {
    socketService.onMessageResponse((data) => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      handleMessageResponse(data);
    });

    socketService.onSessionLoaded((data) => {
      handleSessionLoaded(data);
    });

    // The clearHistory action now directly calls the API, so no socket event listener is needed here.
    // However, if there's a UI element that triggers clearHistory, it should call the store action.

    socketService.onError((errorMsg) => {
      setError(errorMsg);
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    });
  };

  useEffect(() => {
    // Connect only if session is available or an anonymous ID can be established
    if (
      session?.user ||
      (typeof window !== "undefined" &&
        localStorage.getItem("anonymous_user_id"))
    ) {
      connect();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [session]);

  return null;
}
