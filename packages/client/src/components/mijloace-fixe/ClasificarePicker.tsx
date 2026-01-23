import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import type { Clasificare, PaginatedResponse } from "shared";

interface ClasificarePickerProps {
  value?: string; // clasificare cod
  selectedClasificare?: Clasificare; // For displaying selected item details
  onSelect: (clasificare: Clasificare) => void;
  disabled?: boolean;
  error?: boolean;
}

export function ClasificarePicker({
  value,
  selectedClasificare,
  onSelect,
  disabled = false,
  error = false,
}: ClasificarePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Clasificare[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchClasificari() {
      if (debouncedSearch.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const res = await api.get<PaginatedResponse<Clasificare>>(
        `/clasificari?search=${encodeURIComponent(debouncedSearch)}&pageSize=20`
      );

      if (res.success && res.data) {
        setResults(res.data.items);
      } else {
        setResults([]);
      }
      setIsLoading(false);
    }

    fetchClasificari();
  }, [debouncedSearch]);

  const handleSelect = (clasificare: Clasificare) => {
    onSelect(clasificare);
    setOpen(false);
    setSearch("");
    setResults([]);
  };

  // Display text for the trigger button
  const displayText = selectedClasificare
    ? `${selectedClasificare.cod} (${selectedClasificare.grupa})`
    : value || "Selecteaza clasificarea...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && !selectedClasificare && "text-muted-foreground",
            error && "border-destructive"
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cauta clasificare..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 2 && (
              <CommandEmpty>
                Introduceti cel putin 2 caractere pentru cautare.
              </CommandEmpty>
            )}
            {search.length >= 2 && isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Se cauta...
                </span>
              </div>
            )}
            {search.length >= 2 && !isLoading && results.length === 0 && (
              <CommandEmpty>Nu s-au gasit clasificari.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((clasificare) => (
                  <CommandItem
                    key={clasificare.cod}
                    value={clasificare.cod}
                    onSelect={() => handleSelect(clasificare)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === clasificare.cod ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {clasificare.cod}
                        </span>
                        <span className="text-muted-foreground">
                          ({clasificare.grupa})
                        </span>
                      </div>
                      <span
                        className="text-sm text-muted-foreground truncate max-w-[400px]"
                        title={clasificare.denumire}
                      >
                        {clasificare.denumire}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
