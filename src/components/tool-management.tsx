"use client";

import type { Tool, ToolRecord } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolLibrary } from './tool-library';
import { ToolHistory } from './tool-history';
import type { StockRepo } from '@/lib/data/firestore-repo';

interface ToolManagementProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
  toolHistory: ToolRecord[];
  setToolHistory: (history: ToolRecord[]) => void;
  onSetEditingTool: (tool: Tool | null) => void;
  onSetIsAddToolDialogOpen: (isOpen: boolean) => void;
  repo?: StockRepo | null;
}

export default function ToolManagement({
  tools,
  setTools,
  toolHistory,
  setToolHistory,
  onSetEditingTool,
  onSetIsAddToolDialogOpen,
  repo
}: ToolManagementProps) {

  const handleCheckout = (tool: Tool, checkedOutBy: string, company: string, usageLocation: string, checkoutSignature: string) => {
    const newRecord: ToolRecord = {
      id: `TR-${Date.now()}`,
      tool,
      checkoutDate: new Date().toISOString(),
      checkedOutBy: checkedOutBy.toUpperCase(),
      company: company ? company.toUpperCase() : undefined,
      usageLocation: usageLocation.toUpperCase(),
      checkoutSignature,
    };
    setToolHistory([newRecord, ...toolHistory]);
    // Sync to Firestore if enabled
    if (repo) {
      repo.addToolCheckout(newRecord).catch(console.error);
    }
  };

  const handleReturn = (recordId: string, isDamaged: boolean, damageDescription?: string, damagePhoto?: string, signature?: string) => {
    const returnData = {
      returnDate: new Date().toISOString(),
      isDamaged,
      damageDescription: damageDescription?.toUpperCase(),
      damagePhoto,
      returnSignature: signature,
    };
    const newHistory = toolHistory.map((rec: ToolRecord) =>
      rec.id === recordId
        ? { ...rec, ...returnData }
        : rec
    );
    setToolHistory(newHistory);
    // Sync to Firestore if enabled
    if (repo) {
      repo.updateToolReturn(recordId, returnData).catch(console.error);
    }
  };
  
  return (
    <Tabs defaultValue="actions" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="actions">Movimentação</TabsTrigger>
        <TabsTrigger value="library">Biblioteca</TabsTrigger>
      </TabsList>
      <TabsContent value="actions" className="mt-4">
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
          toolHistory={toolHistory}
          onSetEditingTool={onSetEditingTool}
          onSetIsAddToolDialogOpen={onSetIsAddToolDialogOpen}
          repo={repo}
        />
      </TabsContent>
    </Tabs>
  );
}
