"use client";

import { useEffect, useRef, useCallback, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatStore } from "@/stores/chat.store";
import { useChatConnection } from "@/hooks/useChatConnection";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { LazyEnhancedChatInput } from "@/components/lazy";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DragOverlay } from "@/components/ui/DragOverlay";
import { AlertCircle, Trash2 } from "lucide-react";
import { SpinnerIcon } from "@/components/icons";
import { cn } from "@/lib/utils/utils";
import { useToastContext } from "@/components/providers/ToastProvider";
import { dashboardService } from "@/lib/services/dashboard.service";

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasProcessedClinicData, setHasProcessedClinicData] = useState(false);
  const [isProcessingClinicData, setIsProcessingClinicData] = useState(false);
  const [showClinicLoader, setShowClinicLoader] = useState(false);
  const processingRef = useRef(false);
  const { error: toastError } = useToastContext();
  const getUser = async (id: string) => {
    const response = await fetch("/api/dashboard");
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    const data = await response.json();
    if (data.courses.length == 0) {
      toastError("Please buy a course to access Plant clinic.");
      router.push("/videos");
    }
  };

  // Initialize WebSocket connection
  useChatConnection();

  // Get chat state from Zustand store
  const {
    messages,
    isConnected,
    isAuthenticated,
    isTyping,
    error,
    sendMessage,
    clearHistory,
    clearHistoryAndSendMessage,
  } = useChatStore();

  // Move handleDrop to top level before hooks
  const handleDrop = useCallback(
    (files: File[]) => {
      if (isAuthenticated && files.length > 0) {
        const imageFile = files[0];
        // Trigger the ChatInput to handle the dropped file
        const event = new CustomEvent("imageDropped", { detail: imageFile });
        document.dispatchEvent(event);
      }
    },
    [isAuthenticated]
  );

  // Move drag and drop hook to top level
  const { isDragActive, isDragOver, getRootProps } = useDragAndDrop({
    onFilesDropped: handleDrop,
    onError: (error) => {
      toastError("Drag & Drop Error", error);
    },
  });

  // Show loader immediately when coming from clinic
  useEffect(() => {
    const fromClinic = searchParams.get("fromClinic");
    if (fromClinic === "true" && !hasProcessedClinicData) {
      setShowClinicLoader(true);
    }
  }, [searchParams, hasProcessedClinicData]);

  // Process plant clinic data if redirected from clinic
  useEffect(() => {
    const fromClinic = searchParams.get("fromClinic");

    if (
      fromClinic === "true" &&
      !hasProcessedClinicData &&
      !processingRef.current &&
      isConnected &&
      isAuthenticated &&
      session?.user
    ) {
      const processClinicData = async () => {
        processingRef.current = true;
        try {
          setIsProcessingClinicData(true);

          // Get plant clinic data from localStorage
          const clinicDataStr = localStorage.getItem("plantClinicData");
          const imageDataUrl = localStorage.getItem("plantClinicImage");
          const imageName = localStorage.getItem("plantClinicImageName");
          const imageType = localStorage.getItem("plantClinicImageType");

          if (clinicDataStr) {
            const clinicData = JSON.parse(clinicDataStr);

            // Create File object from stored image data
            let imageFile: File | undefined;
            if (imageDataUrl && imageName && imageType) {
              try {
                // Convert base64 back to File object
                const response = await fetch(imageDataUrl);
                const blob = await response.blob();
                imageFile = new File([blob], imageName, { type: imageType });
              } catch (error) {
                console.error("Error converting stored image:", error);
              }
            }

            // Create initial message content
            const initialMessage =
              clinicData.question ||
              "Please analyze my plant and provide recommendations.";

            // Extract plant info for the AI (only if provided)
            const plantInfo = clinicData.plantStage
              ? {
                  stage: clinicData.plantStage?.toLowerCase().includes("veg")
                    ? "vegetative"
                    : clinicData.plantStage?.toLowerCase().includes("flower")
                    ? "flowering"
                    : clinicData.plantStage === "seedling"
                    ? "seedling"
                    : clinicData.plantStage,
                  week: clinicData.weekNumber
                    ? parseInt(clinicData.weekNumber)
                    : undefined,
                }
              : undefined;

            console.log("🌱 Plant info from clinic:", plantInfo);

            // Add a small delay to ensure everything is ready
            setTimeout(() => {
              // Clear chat history and send initial message when coming from plant clinic
              clearHistoryAndSendMessage(initialMessage, imageFile, plantInfo);

              // Clean up localStorage
              try {
                localStorage.removeItem("plantClinicData");
                localStorage.removeItem("plantClinicImage");
                localStorage.removeItem("plantClinicImageName");
                localStorage.removeItem("plantClinicImageType");
              } catch (e) {
                // Ignore localStorage errors
              }

              // Clean up URL
              router.replace("/chat", { scroll: false });

              setHasProcessedClinicData(true);
              setIsProcessingClinicData(false);
              processingRef.current = false;

              // Hide loader after processing
              setTimeout(() => {
                setShowClinicLoader(false);
              }, 1000);
            }, 500);
          }
        } catch (error) {
          setIsProcessingClinicData(false);
          processingRef.current = false;
          setShowClinicLoader(false);
        }
      };

      processClinicData();
    }
  }, [
    searchParams,
    hasProcessedClinicData,
    isConnected, // Add isConnected dependency
    isAuthenticated,
    session,
    clearHistoryAndSendMessage,
    router,
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user.id) {
      getUser(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleFollowUpClick = (question: string) => {
    sendMessage(question);
  };

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Show full screen loader when coming from plant clinic
  if (showClinicLoader) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
            <div className="bg-(--color-gold) text-black px-6 py-3 rounded-xl inline-block mb-4">
              <h2 className="text-2xl font-bold">
                Processing Plant Analysis...
              </h2>
            </div>
            <p className="text-white/80 text-lg mb-6">
              Setting up your plant consultation
            </p>
            <SpinnerIcon size={48} className="text-(--color-gold) mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Drag Overlay */}
      <DragOverlay
        isVisible={isDragActive && isAuthenticated}
        isDragOver={isDragOver}
        message="Drop your cannabis plant image to add it to your message"
      />

      <div
        className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative"
        {...(isAuthenticated ? getRootProps() : {})}
      >
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl mx-4 mt-4 p-4 flex-shrink-0">
            <div className="flex items-center">
              <AlertCircle className="text-red-400 mr-2" size={16} />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-linear-to-b from-[#000000] to-[#F6CA41]/10">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-2xl mx-auto px-4">
                {(searchParams.get("fromClinic") === "true" &&
                  !hasProcessedClinicData) ||
                isProcessingClinicData ? (
                  <div className="bg-white/5 border border-white/20 rounded-2xl p-3 md:p-4 lg:p-6">
                    <div className="bg-(--color-gold) text-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl inline-block mb-2 md:mb-3">
                      <h2 className="text-base md:text-lg lg:text-xl font-bold">
                        Starting Plant Analysis...
                      </h2>
                    </div>
                    <p className="text-white/80 text-xs md:text-sm lg:text-base mb-3 md:mb-4">
                      {!isConnected
                        ? "Connecting to AI service..."
                        : isProcessingClinicData
                        ? "Processing your plant data..."
                        : "Preparing your plant clinic submission..."}
                    </p>
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 border-4 border-(--color-gold)/20 border-t-(--color-gold) mx-auto"></div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/20 rounded-2xl p-3 md:p-4 lg:p-6">
                    <div className="bg-(--color-gold) text-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl inline-block mb-2 md:mb-3">
                      <h2 className="text-lg md:text-xl lg:text-2xl font-bold">
                        Welcome to Q
                      </h2>
                    </div>
                    <h3 className="text-base md:text-lg lg:text-xl font-medium text-(--color-gold) mb-2 md:mb-3">
                      Cannabis Plant Assistant
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm lg:text-base mb-3 md:mb-4 leading-relaxed">
                      {isAuthenticated
                        ? "Upload a photo of your cannabis plant and ask questions about its growth, health, or care. I'll analyze your plant and provide expert recommendations based on proven cultivation protocols."
                        : "Connecting to chat service..."}
                    </p>
                    {isAuthenticated && (
                      <div className="bg-white/5 border border-(--color-gold)/30 rounded-xl p-3 md:p-4 max-w-sm mx-auto">
                        <p className="text-(--color-gold) font-medium mb-1.5 md:mb-2 text-xs md:text-sm">
                          💡 Try asking:
                        </p>
                        <ul className="text-left space-y-1 md:space-y-1.5 text-white/80 text-xs md:text-sm">
                          <li className="flex items-center gap-1.5">
                            <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-(--color-gold) rounded-full flex-shrink-0"></span>
                            'How does my plant look?'
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-(--color-gold) rounded-full flex-shrink-0"></span>
                            'What nutrients does it need?'
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-(--color-gold) rounded-full flex-shrink-0"></span>
                            'Is this ready for harvest?'
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-(--color-gold) rounded-full flex-shrink-0"></span>
                            'What are these spots on the leaves?'
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={clearHistory}
                disabled={!isAuthenticated}
                className={cn(
                  "flex items-center gap-1 md:gap-2 rounded-lg md:rounded-xl transition-colors mb-4",
                  "px-3 md:px-4 py-2 text-xs md:text-sm text-red-400",
                  "hover:bg-red-500/10 border border-red-400/30 disabled:opacity-50"
                )}
              >
                <Trash2 size={14} className="md:w-4 md:h-4" />
                <span className="inline">Clear History</span>
                {/* <span className="sm:hidden">Clear</span> */}
              </button>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onFollowUpClick={handleFollowUpClick}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="flex-shrink-0">
          <Suspense
            fallback={
              <div className="border-t border-white/20 bg-white/5 backdrop-blur-sm p-4">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 animate-pulse">
                  <div className="h-12 bg-white/10 rounded-xl"></div>
                </div>
              </div>
            }
          >
            <LazyEnhancedChatInput
              onSendMessage={(message, image) => sendMessage(message, image)}
              disabled={!isAuthenticated}
              isDiagnosticMode={
                messages.length > 0 &&
                messages[messages.length - 1].metadata?.category ===
                  "diagnostic_questions"
              }
              suggestions={
                messages.length > 0
                  ? messages[messages.length - 1].metadata?.suggestions || []
                  : []
              }
              onSuggestionClick={(suggestion) => {
                sendMessage(suggestion);
              }}
              placeholder={
                isAuthenticated
                  ? messages.length > 0 &&
                    messages[messages.length - 1].metadata?.category ===
                      "diagnostic_questions"
                    ? "Answer the questions above (e.g., '1. Yes, 2. 3 days ago')"
                    : "Describe your plant issue or ask a question..."
                  : "Connecting..."
              }
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function ChatPageSkeleton() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading chat...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}
