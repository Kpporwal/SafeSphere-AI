'use client';

import * as React from 'react';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export type SearchComboboxItem = {
  id: string;
  label: string;
  /**
   * Optional secondary line displayed in results
   * (e.g. employee id).
   */
  secondaryLabel?: string;
  disabled?: boolean;
  /**
   * Searchable text used by shadcn/ui Command for filtering.
   * If not provided, we fall back to `id`.
   */
  searchText?: string;
};

type SearchComboboxProps = {
  value: string | '';
  onValueChange: (value: string) => void;
  items: SearchComboboxItem[];
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export default function SearchCombobox({
  value,
  onValueChange,
  items,
  placeholder = 'Select...',
  className,
  disabled,
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(
    () => items.find((i) => i.id === value) ?? null,
    [items, value]
  );


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          <span className={cn('truncate', value ? 'text-foreground' : 'text-muted-foreground')}>
            {selected ? (
              <span>
                {selected.label}
                {selected.secondaryLabel ? (
                  <span className="ml-2 text-xs text-muted-foreground">{selected.secondaryLabel}</span>
                ) : null}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          {/* CommandInput drives Command's built-in filtering */}
          <CommandInput asChild>
            <div className="px-2 pt-2">
              <Input placeholder="Search..." />
            </div>
          </CommandInput>

          <CommandList className="max-h-72 overflow-hidden">
            <CommandEmpty>No results found.</CommandEmpty>
            <div className="max-h-72 overflow-auto">
              <CommandGroup>
                {items.map((item) => {
                  const searchable = (item.searchText ?? item.id).trim();
                  return (
                    <CommandItem
                      key={item.id}
                      value={searchable}
                      disabled={item.disabled}
                      onSelect={(currentValue) => {
                        // currentValue is the CommandItem.value (searchable text)
                        // Convert it back to the actual selected id.
                        const nextId = item.id;
                        const next = nextId === value ? '' : nextId;
                        onValueChange(next);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {item.id === value ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.secondaryLabel ? (
                          <span className="text-xs text-muted-foreground truncate">{item.secondaryLabel}</span>
                        ) : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

