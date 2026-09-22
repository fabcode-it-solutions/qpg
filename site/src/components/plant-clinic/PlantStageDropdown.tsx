"use client";

import { cn } from "@/lib/utils/utils";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@/components/icons";

interface PlantStageDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const plantStages = [
  { value: "", label: "Select Plant Stage" },
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
];

const PlantStageDropdown: React.FC<PlantStageDropdownProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStage = plantStages.find((stage) => stage.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (stageValue: string) => {
    onChange(stageValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = plantStages.findIndex(
            (stage) => stage.value === value
          );
          const nextIndex = Math.min(currentIndex + 1, plantStages.length - 1);
          onChange(plantStages[nextIndex].value);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          const currentIndex = plantStages.findIndex(
            (stage) => stage.value === value
          );
          const prevIndex = Math.max(currentIndex - 1, 0);
          onChange(plantStages[prevIndex].value);
        }
        break;
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full 2xl:px-6 2xl:py-[23px] xl:px-5 xl:py-5 md:px-4 md:py-4 px-3 py-3",
          "text-left bg-transparent border border-white/50 rounded-[20px] transition-all duration-200 text-(--color-gold)",
          "disabled:bg-gray-700 disabled:cursor-not-allowed",
          "hover:border-(--color-gold) focus:outline-none",
          error &&
            "border-red-400 bg-red-900/20 focus:ring-red-500 focus:border-red-500",
          isOpen && "ring-2 ring-(--color-gold) border-(--color-gold)"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-describedby={error ? "plant-stage-error" : undefined}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "block truncate 2xl:text-[20px] xl:text-[18px] lg:text-[16px] text-[14px] font-medium",
              !value && "text-(--color-gold)",
              value && "text-white"
            )}
          >
            {selectedStage?.label || "Select Plant Stage"}
          </span>
          <ChevronDownIcon
            className={cn(
              "w-6 h-6 text-(--color-gold) transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto">
          <ul role="listbox" className="py-1">
            {plantStages.map((stage) => (
              <li key={stage.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(stage.value)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors duration-150",
                    stage.value === value &&
                      "bg-(--color-gold)/20 text-(--color-gold)",
                    !stage.value && "text-gray-400 italic",
                    stage.value && stage.value !== value && "text-white",
                    "2xl:text-[20px] xl:text-[18px] lg:text-[16px] text-[14px]"
                  )}
                  role="option"
                  aria-selected={stage.value === value}
                >
                  <div className="flex items-center">
                    <span className="block truncate">{stage.label}</span>
                    {stage.value === value && (
                      <CheckIcon
                        className="w-6 h-6 ml-auto text-(--color-gold)"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p
          id="plant-stage-error"
          className="mt-2 text-sm text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default PlantStageDropdown;
