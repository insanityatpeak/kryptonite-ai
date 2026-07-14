"use client";

import { useQuery } from "@tanstack/react-query";
import {
  HistoryIcon,
  KeyboardIcon,
  LayoutGridIcon,
  PlusIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useCreateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { useTRPC } from "@/trpc/client";

const SHORTCUTS: { keys: string[]; label: string; scope: string }[] = [
  { keys: ["Ctrl", "K"], label: "Open command palette", scope: "Anywhere" },
  { keys: ["Shift", "?"], label: "Show keyboard shortcuts", scope: "Anywhere" },
  { keys: ["Ctrl", "S"], label: "Save workflow now", scope: "Editor" },
  { keys: ["Ctrl", "Z"], label: "Undo node/edge deletion", scope: "Editor" },
  { keys: ["Ctrl", "D"], label: "Duplicate selected nodes", scope: "Editor" },
  { keys: ["Del"], label: "Delete selected nodes/edges", scope: "Editor" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const trpc = useTRPC();
  const createWorkflow = useCreateWorkflow();

  const { data } = useQuery({
    ...trpc.workflows.getMany.queryOptions({ search, pageSize: 8 }),
    enabled: open,
  });

  useEffect(() => {
    // Sidebar "Search" button (and anything else) can open the palette via this event
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("open-command-palette", onOpenEvent);
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // Shift+? opens shortcuts help — but never while typing in a field
      if (e.key === "?" && e.shiftKey) {
        const target = e.target as HTMLElement;
        if (
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable
        )
          return;
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleNewWorkflow = () => {
    setOpen(false);
    createWorkflow.mutate(undefined, {
      onSuccess: (w) => router.push(`/workflows/${w.id}`),
    });
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search workflows and run quick actions"
      >
        <CommandInput
          placeholder="Search workflows or type a command…"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleNewWorkflow}>
              <PlusIcon className="size-4" /> New workflow
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setShortcutsOpen(true);
              }}
            >
              <KeyboardIcon className="size-4" /> Keyboard shortcuts
              <Kbd className="ml-auto">?</Kbd>
            </CommandItem>
          </CommandGroup>

          {(data?.items?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Workflows">
                {data!.items.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={`workflow-${w.name}-${w.id}`}
                    onSelect={() => go(`/workflows/${w.id}`)}
                  >
                    <WorkflowIcon className="size-4" /> {w.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => go("/workflows")}>
              <LayoutGridIcon className="size-4" /> All workflows
            </CommandItem>
            <CommandItem onSelect={() => go("/executions")}>
              <HistoryIcon className="size-4" /> Executions
            </CommandItem>
            <CommandItem onSelect={() => go("/workflows/trash")}>
              <Trash2Icon className="size-4" /> Trash
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyboardIcon className="size-4" /> Keyboard shortcuts
            </DialogTitle>
            <DialogDescription>Work faster in Kryptonite.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {SHORTCUTS.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <div>
                  <span className="text-sm">{s.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.scope}
                  </span>
                </div>
                <div className="flex gap-1">
                  {s.keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
