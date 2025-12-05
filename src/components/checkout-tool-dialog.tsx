
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
  onConfirm: (data: { checkedOutBy: string; company: string; usageLocation: string; signature: string }) => void;
}

export function CheckoutToolDialog({ isOpen, onOpenChange, tool, onConfirm }: CheckoutToolDialogProps) {
  const { toast } = useToast();
  const [checkedOutBy, setCheckedOutBy] = useState('');
  const [company, setCompany] = useState('');
  const [usageLocation, setUsageLocation] = useState('');
  
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setCheckedOutBy('');
      setCompany('');
      setUsageLocation('');
      signaturePadRef.current?.clear();
      setSignatureDataUrl('');
    }
  }, [isOpen]);

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    setSignatureDataUrl('');
  };

  useEffect(() => {
    // restore saved signature to the pad if available
    if (signatureDataUrl && signaturePadRef.current) {
      try {
        if (signaturePadRef.current.isEmpty()) {
          signaturePadRef.current.fromDataURL(signatureDataUrl);
        }
      } catch (err) {
        // ignore restore errors
      }
    }
  }, [signatureDataUrl]);
  
  const handleSave = () => {
    if (!checkedOutBy || !usageLocation) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha quem está retirando e o local de uso.',
      });
      return;
    }
    
    if (!signatureDataUrl && signaturePadRef.current?.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Assinatura Obrigatória',
        description: 'Por favor, o responsável deve assinar para confirmar a retirada.',
      });
      return;
    }

    // prefer persisted signature data if present
    const signature = signatureDataUrl || signaturePadRef.current?.toDataURL('image/png') ?? '';
    
    onConfirm({
      checkedOutBy,
      company,
      usageLocation,
      signature,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">Retirada de Ferramenta</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Registrando a saída de: <strong>{tool.name} ({tool.assetId})</strong>
          </DialogDescription>
        </DialogHeader>

  <div className="space-y-5 py-3">
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
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              placeholder="Ex: EMPRESA XYZ"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
                onEnd={() => {
                  try {
                    const d = signaturePadRef.current?.toDataURL('image/png') ?? '';
                    if (d) setSignatureDataUrl(d);
                  } catch {}
                }}
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
