
"use client";

import type { Tool, ToolRecord } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolLibrary } from './tool-library';
import { ToolHistory } from './tool-history';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';

interface ToolManagementProps {
  tools: Tool[];
  setTools: (tools: Tool[]) => Promise<void>;
  toolHistory: ToolRecord[];
  setToolHistory: (history: ToolRecord[]) => Promise<void>;
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
  const { user } = useUser();
  const firestore = useFirestore();

  const handleCheckout = async (tool: Tool, checkedOutBy: string, usageLocation: string, checkoutSignature: string) => {
    if (!user || !firestore) return;
    const newRecord: ToolRecord = {
      id: `TR-${Date.now()}`,
      tool,
      checkoutDate: new Date().toISOString(),
      checkedOutBy: checkedOutBy.toUpperCase(),
      usageLocation: usageLocation.toUpperCase(),
      checkoutSignature,
    };
    
    const recordRef = doc(firestore, 'users', user.uid, 'toolHistory', newRecord.id);
    const batch = writeBatch(firestore);
    batch.set(recordRef, newRecord);
    await batch.commit();

    // This will trigger a re-fetch in the parent component
    setToolHistory([newRecord, ...toolHistory]);
  };

  const handleReturn = async (recordId: string, isDamaged: boolean, damageDescription?: string, damagePhoto?: string, signature?: string) => {
    const updatedHistory = toolHistory.map(rec => 
      rec.id === recordId 
      ? { 
          ...rec, 
          returnDate: new Date().toISOString(),
          isDamaged,
          damageDescription: damageDescription?.toUpperCase(),
          damagePhoto,
          returnSignature: signature
        } 
      : rec
    );
    await setToolHistory(updatedHistory);
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
        />
      </TabsContent>
    </Tabs>
  );
}
