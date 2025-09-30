
"use client";

import { useState } from 'react';
import type { Tool, ToolRecord } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolLibrary } from './tool-library';
import { ToolHistory } from './tool-history';

interface ToolManagementProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
  toolHistory: ToolRecord[];
  setToolHistory: (history: ToolRecord[]) => void;
  onSetEditingTool: (tool: Tool | null) => void;
  onSetIsAddToolDialogOpen: (isOpen: boolean) => void;
}

export default function ToolManagement({
  tools,
  setTools,
  toolHistory,
  setToolHistory,
  onSetEditingTool,
  onSetIsAddToolDialogOpen
}: ToolManagementProps) {

  const handleCheckout = (tool: Tool, checkedOutBy: string, usageLocation: string) => {
    const newRecord: ToolRecord = {
      id: `TR-${Date.now()}`,
      tool,
      checkoutDate: new Date().toISOString(),
      checkedOutBy: checkedOutBy.toUpperCase(),
      usageLocation: usageLocation.toUpperCase(),
    };
    setToolHistory([newRecord, ...toolHistory]);
  };

  const handleReturn = (recordId: string, isDamaged: boolean, damageDescription?: string, damagePhoto?: string, signature?: string) => {
    setToolHistory(toolHistory.map(rec => 
      rec.id === recordId 
      ? { 
          ...rec, 
          returnDate: new Date().toISOString(),
          isDamaged,
          damageDescription: damageDescription?.toUpperCase(),
          damagePhoto,
          signature
        } 
      : rec
    ));
  };
  
  return (
    <Tabs defaultValue="history" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="history">Histórico & Retiradas</TabsTrigger>
        <TabsTrigger value="library">Biblioteca de Ferramentas</TabsTrigger>
      </TabsList>
      <TabsContent value="history" className="mt-4">
        <ToolHistory
            tools={tools}
            history={toolHistory}
            onCheckout={handleCheckout}
            onReturn={handleReturn}
        />
      </TabsContent>
      <TabsContent value="library" className="mt-4">
        <ToolLibrary
          tools={tools}
          setTools={setTools}
          onSetEditingTool={onSetEditingTool}
          onSetIsAddToolDialogOpen={onSetIsAddToolDialogOpen}
        />
      </TabsContent>
    </Tabs>
  );
}

    
