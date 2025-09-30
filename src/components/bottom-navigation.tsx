
"use client";

import { HardDriveDownload, Package, History, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type View = "release" | "items" | "history";

interface NavButtonProps {
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  label: string;
  children: React.ReactNode;
}

const NavButton = ({ view, currentView, onClick, label, children }: NavButtonProps) => (
  <button
    onClick={() => onClick(view)}
    className={cn(
      "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
      currentView === view ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
    )}
  >
    {children}
    <span>{label}</span>
  </button>
);

interface BottomNavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onAddItemClick: () => void;
}

export default function BottomNavigation({ currentView, onViewChange, onAddItemClick }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t shadow-[0_-1px_4px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto relative">
        <div className="w-1/4">
          <NavButton view="release" currentView={currentView} onClick={onViewChange} label="Lançamento">
            <HardDriveDownload className="h-5 w-5" />
          </NavButton>
        </div>
        <div className="w-1/4">
          <NavButton view="items" currentView={currentView} onClick={onViewChange} label="Itens">
            <Package className="h-5 w-5" />
          </NavButton>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <Button
            size="icon"
            className="rounded-full w-14 h-14 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={onAddItemClick}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Cadastrar Novo Item</span>
          </Button>
        </div>

        <div className="w-1/4">
          <NavButton view="history" currentView={currentView} onClick={onViewChange} label="Histórico">
            <History className="h-5 w-5" />
          </NavButton>
        </div>
        <div className="w-1/4">
            {/* Placeholder for potential 4th item */}
        </div>
      </div>
    </div>
  );
}
