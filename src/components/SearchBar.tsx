import { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Sync external value changes (like clear)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative group w-full sm:w-64">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500 group-focus-within:text-black transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search tasks..."
        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-full text-sm font-bold text-black
                   placeholder-gray-400 focus:outline-none focus:shadow-brutal shadow-brutal-sm
                   transition-all duration-200"
      />
      {localValue && (
        <button
          onClick={() => setLocalValue("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
