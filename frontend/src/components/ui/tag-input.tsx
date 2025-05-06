import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag: string) => {
    // Clean the tag - lowercase, trim, no special chars except hyphen/space
    const cleanedTag = tag.trim().toLowerCase();

    // Skip if tag is empty or already exists
    if (!cleanedTag || value.includes(cleanedTag) || value.length >= maxTags) {
      setInputValue("");
      return;
    }

    // Add the new tag to the array
    onChange([...value, cleanedTag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on enter or space
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }

    // Remove the last tag on backspace if input is empty
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 border rounded-md p-2 focus-within:ring-1 focus-within:ring-ring">
      {value.map((tag, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 hover:bg-muted"
            onClick={() => removeTag(tag)}
          >
            <X size={12} />
            <span className="sr-only">Remove tag</span>
          </Button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 p-0 text-sm focus-visible:ring-0 min-w-[120px]"
      />
    </div>
  );
}
