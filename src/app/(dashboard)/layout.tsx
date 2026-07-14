import { AiAssistant } from "@/components/ai-assistant";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="h-full min-h-dvh"
      style={{
        background:
          "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 35%, #fdf2f8 65%, #eff6ff 100%)",
      }}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset style={{ background: "transparent" }}>
          {children}
        </SidebarInset>
        <AiAssistant />
        <CommandPalette />
      </SidebarProvider>
    </div>
  );
};

export default Layout;
