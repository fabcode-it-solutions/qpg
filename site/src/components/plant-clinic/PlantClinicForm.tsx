"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PlantStageDropdown from "./PlantStageDropdown";
import type { FormData, FormErrors } from "@/types";
import Image from "next/image";
import { truncateWords } from "@/lib/utils/sanitize";
import { cn } from "@/lib/utils/utils";
import { SpinnerIcon } from "@/components/icons";
import { X, AlertTriangle } from "lucide-react";
import { formatFileSize } from "@/lib/utils/utils";

const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
} as const;

const PlantClinicForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    plantImage: null,
    question: "",
    plantStage: "",
    weekNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      const allowedFormats = UPLOAD_CONFIG.ALLOWED_TYPES.map((type) =>
        type.split("/")[1].toUpperCase()
      ).join(", ");
      return `Invalid file type. Please upload: ${allowedFormats}`;
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
      return `File size exceeds ${maxSizeMB}MB limit. Current: ${formatFileSize(
        file.size
      )}`;
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (imageError) {
      return false;
    }

    // Validate question
    if (!formData.question.trim()) {
      newErrors.question = "Please enter your question";
    }

    // Validate week/day number based on plant stage
    if (formData.plantStage && formData.plantStage.includes("flowering")) {
      if (!formData.weekNumber) {
        newErrors.weekNumber =
          "Please enter the day number for flowering stage";
      } else {
        const dayNum = Number(formData.weekNumber);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 84) {
          // 12 weeks * 7 days
          newErrors.weekNumber = "Please enter a valid day number (1-84)";
        }
      }
    } else if (formData.plantStage && formData.plantStage !== "") {
      if (!formData.weekNumber) {
        newErrors.weekNumber = "Please enter the week number";
      } else {
        const weekNum = Number(formData.weekNumber);
        if (isNaN(weekNum) || weekNum < 0 || weekNum > 52) {
          newErrors.weekNumber = "Please enter a valid week number (0-52)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Store plant clinic data for chat page
      const plantClinicData = {
        question: formData.question,
        plantStage: formData.plantStage,
        weekNumber: formData.weekNumber,
        imageFile: formData.plantImage,
        timestamp: Date.now(),
      };

      // Store the data in localStorage (except the File object)
      const storageData = {
        question: plantClinicData.question,
        plantStage: plantClinicData.plantStage,
        weekNumber: plantClinicData.weekNumber,
        timestamp: plantClinicData.timestamp,
      };
      localStorage.setItem("plantClinicData", JSON.stringify(storageData));

      // Store the image file separately if it exists
      if (formData.plantImage) {
        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem("plantClinicImage", e.target?.result as string);
          localStorage.setItem(
            "plantClinicImageName",
            formData.plantImage?.name || ""
          );
          localStorage.setItem(
            "plantClinicImageType",
            formData.plantImage?.type || ""
          );

          // Redirect to chat page with initial data flag
          router.push("/chat?fromClinic=true");
        };
        reader.onerror = () => {
          console.error("Failed to read image file");
          setIsSubmitting(false);
        };
        reader.readAsDataURL(formData.plantImage);
      } else {
        // Redirect to chat page without image
        router.push("/chat?fromClinic=true");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageError(null);
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setImageError(validationError);
        handleInputChange("plantImage", null);
        const fileInput = document.getElementById(
          "plant-image-upload"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        return;
      }
    }
    handleInputChange("plantImage", file);
  };

  const handleRemoveImage = () => {
    handleInputChange("plantImage", null);
    setImageError(null);
    const fileInput = document.getElementById(
      "plant-image-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const numberInputOnWheelPreventChange = (e: any) => {
    // Prevent the input value change
    e.target.blur();

    // Prevent the page/container scrolling
    e.stopPropagation();

    // Refocus immediately, on the next tick (after the currentfunction is done)
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-7 m-auto",
        "2xl:max-w-[68%], xl:max-w-[70%] lg:max-w-[75%] md:max-w-[80%] sm:max-w-[88%] max-w-[95%]"
      )}
    >
      {/* Upload Photo Section */}
      <div
        className={cn(
          "bg-white/10 border border-white/50 rounded-2xl",
          "2xl:py-6 2xl:px-6 md:py-5 md:px-5 py-3 px-3"
        )}
      >
        <div className="flex items-start gap-6">
          {/* Upload Label acts as a trigger */}
          <div className="flex-shrink-0 m-auto">
            {formData.plantImage ? (
              <div className="relative">
                <label htmlFor="plant-image-upload" className="cursor-pointer">
                  <div
                    className={cn(
                      "border border-(--color-gold) rounded-[10px] flex items-center justify-center overflow-hidden",
                      "2xl:w-[140px] 2xl:h-[110px] lg:w-[130px] lg:h-[100px] md:w-[120px] md:h-[90px] sm:w-[100px] sm:h-[80px] w-[80px] h-[60px]"
                    )}
                  >
                    <img
                      src={URL.createObjectURL(formData.plantImage)}
                      alt="Uploaded"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label htmlFor="plant-image-upload" className="cursor-pointer">
                <div
                  className={cn(
                    "2xl:py-5 2xl:px-8.5 xl:py-4 xl:px-7.5 lg:py-3.5 lg:px-6.8 sm:py-2.8 sm:px-5 py-2 px-3",
                    "border border-(--color-gold) rounded-[10px] flex items-center justify-center overflow-hidden"
                  )}
                >
                  <Image
                    src="/images/camera-icon.png"
                    alt="camera icon"
                    className={cn(
                      "object-cover max-w-[none]",
                      "2xl:w-[70px] 2xl:h-[70px] xl:w-[60px] xl:h-[60px] md:w-[50px] md:h-[50px] w-[35px] h-[35px]"
                    )}
                    width={100}
                    height={100}
                  />
                </div>
              </label>
            )}
          </div>

          {/* Upload Text + Textarea */}
          <div className="flex-1 m-auto">
            <h3
              className={cn(
                "xl:text-[24px] lg:text-[20px] md:text-[18px] text-[14px] 2xl:text-[30px]",
                "font-medium text-(--color-gold) truncate text-clip 2xl:mb-[10px] lg:mb-[8px] md:mb-[6px] mb-[4px]"
              )}
            >
              {formData.plantImage
                ? truncateWords(formData.plantImage.name, 18)
                : "Upload Photo"}
            </h3>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={isSubmitting}
              className="hidden"
              id="plant-image-upload"
            />

            <textarea
              name="question"
              id="question"
              value={formData.question}
              onChange={(e) => handleInputChange("question", e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "2xl:text-[24px] lg:text-[20px] sm:text-[16px] text-[14px]",
                "w-full bg-transparent border border-none rounded-[5px] text-(--color-gold)",
                "placeholder-white/50 transition-all duration-200 resize-none",
                "focus:outline-none bg-white/5 py-2 px-3",
                "2xl:h-[60px] lg:h-[50px] md:h-[40px]"
              )}
              rows={1}
              placeholder="Type your question here..."
            />

            {errors.question && (
              <div className="mt-2 space-y-1">
                <p className="text-red-400 text-sm">{errors.question}</p>
              </div>
            )}
          </div>
        </div>
        {imageError && (
          <div className="mt-4 p-4 bg-red-500/10 border-t border-red-400/30 rounded-b-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={16} />
              <span className="text-sm">{imageError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Plant Stage Dropdown */}
      <div>
        <PlantStageDropdown
          value={formData.plantStage}
          onChange={(value: string) => handleInputChange("plantStage", value)}
          error={errors.plantStage}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <input
          type="number"
          min="0"
          max="84"
          value={formData.weekNumber}
          onChange={(e) => handleInputChange("weekNumber", e.target.value)}
          disabled={isSubmitting}
          onWheel={numberInputOnWheelPreventChange}
          className={cn(
            "2xl:px-6 2xl:py-[23px] xl:px-5 xl:py-5 md:px-4 md:py-4 px-3 py-3",
            "w-full bg-transparent border border-white/50 rounded-[20px] text-white placeholder-(--color-gold)",
            "transition-all duration-200",
            "2xl:text-[20px] xl:text-[18px] lg:text-[16px] text-[14px] font-medium"
          )}
          placeholder={
            formData.plantStage && formData.plantStage.includes("flowering")
              ? "Enter Day Number"
              : "Enter Week Number"
          }
        />
        {errors.weekNumber && (
          <p className="mt-2 text-red-400 text-sm">{errors.weekNumber}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "2xl:text-[30px] xl:text-[24px] lg:text-[22px] md:text-[20px] sm:text-[18px] text-[16px]",
            "2xl:py-[22px] 2xl:px-[22px] lg:py-[18px] lg:px-[18px] sm:py-[16px] sm:px-[16px] py-[12px] px-[12px]",
            "w-full bg-(--color-gold) hover:bg-(--color-gold)/90 text-black font-medium rounded-[20px] transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed leading-[normal]",
            "focus:outline-none focus:ring-4 focus:ring-(--color-gold)/30"
          )}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <SpinnerIcon className="-ml-1 mr-3 h-5 w-5" />
              Sending to Clinic...
            </div>
          ) : (
            "Send to Clinic"
          )}
        </button>
      </div>
    </form>
  );
};

export default PlantClinicForm;
