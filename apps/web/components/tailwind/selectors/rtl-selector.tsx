"use client";

import { Check, ChevronDown, Languages, AlignLeft, AlignRight } from "lucide-react";
import { useEditor } from "novel";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export interface RTLSelectorProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const RTLSelector = ({ isOpen, setIsOpen }: RTLSelectorProps) => {
  const { editor } = useEditor();
  const items = [
    {
      name: "Left to Right",
      description: "Default text direction",
      direction: "ltr" as const,
      icon: AlignLeft,
    },
    {
      name: "Right to Left",
      description: "Hebrew, Arabic text direction",
      direction: "rtl" as const,
      icon: AlignRight,
    },
  ];

  const activeItem = items.find((item) => {
    // Check if current selection has RTL direction
    const { from } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);
    const currentDir = node?.attrs?.dir || 'ltr';
    return item.direction === currentDir;
  });

  return (
    <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 rounded-none border-none">
          <Languages className="h-4 w-4" />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={5} className="my-1 flex max-h-80 w-60 flex-col overflow-hidden rounded p-1 ">
        <div className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Text Direction
        </div>
        {items.map((item, index) => (
          <Button
            key={index}
            onClick={() => {
              editor.commands.setTextDirection(item.direction);
              setIsOpen(false);
            }}
            variant="ghost"
            className="flex h-auto items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            type="button"
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border p-1">
                <item.icon className="h-3 w-3" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
            {activeItem?.direction === item.direction && <Check className="h-4 w-4" />}
          </Button>
        ))}
        <div className="border-t border-border my-1" />
        <Button
          onClick={() => {
            editor.commands.toggleTextDirection();
            setIsOpen(false);
          }}
          variant="ghost"
          className="flex h-auto items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          type="button"
        >
          <div className="flex items-center space-x-2">
            <div className="rounded-sm border p-1">
              <Languages className="h-3 w-3" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Toggle Direction</div>
              <div className="text-xs text-muted-foreground">Ctrl+Shift+R</div>
            </div>
          </div>
        </Button>
      </PopoverContent>
    </Popover>
  );
};