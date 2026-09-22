"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils/utils";
import { Protocol, ProtocolsResponse } from "@/types/protocol";

const useProtocols = () => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProtocols = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/protocols", {
        headers: {
          "Cache-Control": "max-age=300",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProtocolsResponse = await response.json();

      if (data.success && data.data) {
        setProtocols(data.data);
      } else {
        setError(data.error || "Failed to fetch protocols");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  return useMemo(
    () => ({ protocols, loading, error }),
    [protocols, loading, error]
  );
};

const ProtocolDocuments: React.FC = React.memo(() => {
  const { protocols, loading, error } = useProtocols();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Protocol | null>(
    null
  );

  const handleDocumentSelect = useCallback((protocol: Protocol) => {
    setSelectedDocument(protocol);
    setIsOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDocument = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  const downloadProtocol = useCallback((protocol: Protocol) => {
    const element = document.createElement("a");
    const file = new Blob([protocol.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${protocol.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }, []);

  const canDownload = useCallback((protocol: Protocol) => {
    return (
      protocol.category === "nutrients" || protocol.category === "environment"
    );
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-semibold text-(--color-gold)">
            QPG Protocol Documents
          </h3>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-semibold text-(--color-gold)">
            QPG Protocol Documents
          </h3>
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-center sm:items-center mb-6">
        <h3 className="text-xl font-semibold text-(--color-gold)">
          QPG Protocol Documents
        </h3>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2 min-w-[250px]",
              "bg-gray-800 border border-gray-600 rounded-lg",
              "text-white hover:bg-gray-700 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-(--color-gold)"
            )}
          >
            <span>
              {selectedDocument
                ? selectedDocument.title
                : "Select a protocol document"}
            </span>
            <ChevronDownIcon
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {protocols.map(
                (protocol) =>
                  (protocol.category == "nutrients" ||
                    protocol.category == "environment") && (
                    <button
                      key={protocol.id}
                      onClick={() => handleDocumentSelect(protocol)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors",
                        "first:rounded-t-lg last:rounded-b-lg",
                        "border-b border-gray-600 last:border-b-0"
                      )}
                    >
                      <div className="text-white font-medium">
                        {protocol.title}
                      </div>
                      <div className="text-gray-400 text-sm capitalize">
                        {protocol.category}
                      </div>
                      {protocol.tags && protocol.tags.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {protocol.tags.slice(0, 3).join(", ")}
                        </div>
                      )}
                    </button>
                  )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Display */}
      {selectedDocument && (
        <div
          className={cn(
            "bg-gray-900 border border-gray-600 rounded-lg p-6",
            "max-h-[600px] overflow-y-auto"
          )}
        >
          <div className="flex justify-between items-start mb-4 flex-col-reverse sm:flex-row">
            <h4 className="text-lg font-semibold text-(--color-gold)">
              {selectedDocument.title}
            </h4>
            <div className="flex gap-2 ml-auto mb-2 sm:mb-0">
              {canDownload(selectedDocument) && (
                <button
                  onClick={() => downloadProtocol(selectedDocument)}
                  className={cn(
                    "px-3 py-1 text-sm bg-(--color-gold) text-black rounded",
                    "hover:bg-(--color-gold)/80 transition-colors font-medium"
                  )}
                >
                  Download
                </button>
              )}
              <button
                onClick={closeDocument}
                className={cn(
                  "px-3 py-1 text-sm bg-gray-700 text-white rounded",
                  "hover:bg-gray-600 transition-colors"
                )}
              >
                Close
              </button>
            </div>
          </div>

          <div className="text-white whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {selectedDocument.content}
          </div>
        </div>
      )}
    </div>
  );
});

export default ProtocolDocuments;
