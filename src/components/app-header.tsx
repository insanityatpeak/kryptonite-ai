import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/60 px-4 liquid-glass">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
    </header>
  );
};
