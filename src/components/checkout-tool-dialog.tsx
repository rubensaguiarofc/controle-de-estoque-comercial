
"use client";

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';
import type { Tool } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface CheckoutToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tool: Tool;
  onConfirm: (data: { checkedOutBy: string; usageLocation: string; signature: string }) => void;
}

export function CheckoutToolDialog({ isOpen, onOpenChange, tool, onConfirm }: CheckoutToolDialogProps) {
  const { toast } = useToast();
  const [checkedOutBy, setCheckedOutBy] = useState('');
  const [usageLocation, setUsageLocation] = useState('');
  
  const signaturePadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setCheckedOutBy('');
      setUsageLocation('');
      signaturePadRef.current?.clear();
    }
  }, [isOpen]);

  const handleClearSignature = () => signaturePadRef.current?.clear();
  
  const handleSave = () => {
    if (!checkedOutBy || !usageLocation) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha quem está retirando e o local de uso.',
      });
      return;
    }
    
    if (signaturePadRef.current?.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Assinatura Obrigatória',
        description: 'Por favor, o responsável deve assinar para confirmar a retirada.',
      });
      return;
    }

    const signature = signaturePadRef.current?.toDataURL('image/png') ?? '';
    
    onConfirm({
      checkedOutBy,
      usageLocation,
      signature,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Retirada de Ferramenta</DialogTitle>
          <DialogDescription>
            Registrando a saída de: <strong>{tool.name} ({tool.assetId})</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="checked-out-by">Retirado por (Obrigatório)</Label>
            <Input
              id="checked-out-by"
              placeholder="Nome do responsável"
              value={checkedOutBy}
              onChange={(e) => setCheckedOutBy(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage-location">Local de Uso (Obrigatório)</Label>
            <Input
              id="usage-location"
              placeholder="Ex: OBRA-01, OFICINA"
              value={usageLocation}
              onChange={(e) => setUsageLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="signature-checkout">Assinatura do Responsável (Obrigatório)</Label>
                <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                    <Eraser className="mr-2 h-4 w-4" /> Limpar
                </Button>
            </div>
            <div className="rounded-md border border-input bg-background">
              <SignatureCanvas
                ref={signaturePadRef}
                penColor="black"
                canvasProps={{ id: 'signature-checkout', className: 'w-full h-[120px]' }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar Retirada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
