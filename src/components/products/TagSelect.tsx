"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useBusinessId } from "@/components/providers/BusinessProvider";

type TagOption = {
  id: number;
  title: string;
};

interface TagSelectProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
}

export default function TagSelect({ selectedTags, onTagsChange }: TagSelectProps) {
  const businessId = useBusinessId();
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTags = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/${businessId}/tags`);
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setTags(
        (data.tags || data).map((tag: any) => ({
          id: tag.id ?? tag.BUSINESS_PRODUCT_TAG_ID,
          title: tag.title ?? tag.TITLE ?? "Untitled tag",
        }))
      );
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  function toggleTag(tagId: number) {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  }

  function removeTag(tagId: number) {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading tags...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <Badge
              key={tag.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              {tag.title}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeTag(tag.id);
                }}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      {/* Tag Selector */}
      <Command className="border rounded-md">
        <CommandInput placeholder="Search tags..." />
        <CommandEmpty>No tags found.</CommandEmpty>
        <CommandGroup className="max-h-48 overflow-auto">
          {tags.map(tag => (
            <CommandItem
              key={tag.id}
              value={tag.title}
              onSelect={() => toggleTag(tag.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`flex-shrink-0 rounded-sm w-4 h-4 border flex items-center justify-center ${
                selectedTags.includes(tag.id) ? 'bg-foodeez-primary border-foodeez-primary' : 'border-gray-300'
              }`}>
                {selectedTags.includes(tag.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span>{tag.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </div>
  );
}
