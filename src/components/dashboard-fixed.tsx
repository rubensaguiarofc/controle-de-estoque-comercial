"use client";

import { useState, useEffect } from "react";
import type { StockItem, Tool } from "@/lib/types";

interface DashboardFixedProps {
  stockItems: StockItem[];
  tools: Tool[];
  onNavigate: (view: "dashboard" | "release" | "entry" | "items" | "history" | "tools") => void;
}

export default function DashboardFixed({ stockItems, tools, onNavigate }: DashboardFixedProps) {
  const [searchValue, setSearchValue] = useState("");
  
  // Calcular métricas
  const lowStockThreshold = 5;
  const totalItemTypes = stockItems.length;
  const totalUnitsInStock = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = stockItems.filter(item => item.quantity <= lowStockThreshold).length;
  const activeTools = tools.filter(tool => tool.isActive !== false).length;

  return (
    <div className="flex-1 bg-background">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-primary text-2xl">inventory</span>
              <h1 className="text-xl font-semibold text-foreground">Controle de Almoxarifado</h1>
            </div>
            <button className="p-2 rounded-lg hover:bg-muted">
              <span className="material-icons text-muted-foreground">notifications</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Campo de busca */}
        <div className="relative">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            search
          </span>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Pesquisar itens..."
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Cards de métricas */}
        <div className="space-y-4">
          {/* Tipos de Itens */}
          <div 
            className="bg-card p-5 rounded-lg shadow-sm flex justify-between items-start cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('items')}
          >
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Tipos de Itens</h2>
              <p className="text-3xl font-bold mt-1 text-foreground">{totalItemTypes}</p>
              <p className="text-xs text-muted-foreground mt-1">Itens cadastrados</p>
            </div>
            <span className="material-icons text-primary">category</span>
          </div>

          {/* Unidades em Estoque */}
          <div className="bg-card p-5 rounded-lg shadow-sm flex justify-between items-start">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Unidades em Estoque</h2>
              <p className="text-3xl font-bold mt-1 text-foreground">{totalUnitsInStock}</p>
              <p className="text-xs text-muted-foreground mt-1">Soma de quantidades</p>
            </div>
            <span className="material-icons text-primary">inventory_2</span>
          </div>

          {/* Itens em Baixo Nível */}
          <div 
            className="bg-card p-5 rounded-lg shadow-sm flex justify-between items-start cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('items')}
          >
            <div>
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Itens em Baixo Nível
                <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                  filtrável
                </span>
              </h2>
              <p className="text-3xl font-bold mt-1 text-red-500">{lowStockItems}</p>
              <p className="text-xs text-muted-foreground mt-1">≤ {lowStockThreshold} unidades</p>
            </div>
            <span className="material-icons text-red-500">warning</span>
          </div>

          {/* Ferramentas */}
          <div 
            className="bg-card p-5 rounded-lg shadow-sm flex justify-between items-start cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('tools')}
          >
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Ferramentas</h2>
              <p className="text-3xl font-bold mt-1 text-foreground">{activeTools}</p>
              <p className="text-xs text-muted-foreground mt-1">Ferramentas ativas</p>
            </div>
            <span className="material-icons text-primary">build</span>
          </div>
        </div>
      </main>

      {/* Espaçamento para a bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
}