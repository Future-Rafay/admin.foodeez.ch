"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useBusinessId } from "@/components/providers/BusinessProvider";

type TagOption = {
  id: number;
  title: string;
};

interface TagFilterProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  className?: string;
}

export default function TagFilter({ selectedTags, onTagsChange, className }: TagFilterProps) {
  const businessId = useBusinessId();
  const [open, setOpen] = useState(false);
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

  function clearAll() {
    onTagsChange([]);
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading tags...</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between text-sm bg-white border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span>Filter by tags</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." className="h-9" />
              <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                No tags found.
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {tags.map(tag => (
                  <CommandItem
                    key={tag.id}
                    value={tag.title}
                    onSelect={() => toggleTag(tag.id)}
                    className="cursor-pointer"
                  >
                    <div className={`mr-3 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                      selectedTags.includes(tag.id) 
                        ? 'bg-foodeez-primary border-foodeez-primary' 
                        : 'border-gray-300'
                    }`}>
                      {selectedTags.includes(tag.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{tag.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <Badge
                key={tag.id}
                variant="secondary"
                className="pl-3 pr-2 py-1.5 flex items-center gap-2 bg-foodeez-primary/10 text-foodeez-primary border border-foodeez-primary/20 hover:bg-foodeez-primary/15 transition-colors"
              >
                <span className="text-sm font-medium">{tag.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    removeTag(tag.id);
                  }}
                  className="hover:bg-foodeez-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
