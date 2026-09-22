"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { countries, getCountryById, type Country } from "@/lib/utils/countries";

interface CountrySelectProps {
  value: string;
  onChange: (country: Country) => void;
  className?: string;
  disabled?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  className,
  disabled = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = getCountryById(value);

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.includes(searchTerm)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between px-3 py-3 bg-white/5 border rounded-xl",
          "text-white focus:outline-none w-[90px] transition-all duration-200",
          "border-white/20 focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex items-center gap-1 text-sm">
          {selectedCountry.flag} {selectedCountry.code}
        </span>
        <svg
          className={cn(
            "w-3 h-3 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-80 mt-1 bg-gray-800 border border-white/20 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 transition-colors",
                    selectedCountry.id === country.id && "bg-white/5"
                  )}
                >
                  <span className="text-lg flex-shrink-0">{country.flag}</span>
                  <span className="text-white/70 text-sm font-mono min-w-[50px] flex-shrink-0">{country.code}</span>
                  <span className="text-white text-sm truncate">{country.name}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-white/50">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}