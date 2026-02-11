"use client";

import * as React from "react";
import { Check, X, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string[]) => void;
  defaultValue?: string[];
}

export function MultiSelect({
  options,
  placeholder = "Select options...",
  className,
  onValueChange,
  defaultValue = [],
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<MultiSelectOption[]>(
    options.filter((o) => defaultValue.includes(o.value))
  );

  const handleSelect = (option: MultiSelectOption) => {
    const isSelected = selected.some((s) => s.value === option.value);
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter((i) => i.value !== option.value);
    } else {
      newSelected = [...selected, option];
    }
    setSelected(newSelected);
    onValueChange?.(newSelected.map((s) => s.value));
  };

  const handleUnselect = (item: MultiSelectOption) => {
    const newSelected = selected.filter((i) => i.value !== item.value);
    setSelected(newSelected);
    onValueChange?.(newSelected.map((s) => s.value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  variant="secondary"
                  key={item.value}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(item);
                  }}
                >
                  {item.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.some(s => s.value === option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      handleSelect(option);
                      setOpen(true);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
