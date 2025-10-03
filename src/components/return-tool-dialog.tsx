
"use client";

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, Eraser, Undo } from 'lucide-react';
import type { ToolRecord } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';

interface ReturnToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  record: ToolRecord;
  onConfirm: (data: { isDamaged: boolean; damageDescription?: string; damagePhoto?: string; signature: string; }) => void;
}

export function ReturnToolDialog({ isOpen, onOpenChange, record, onConfirm }: ReturnToolDialogProps) {
  const { toast } = useToast();
  const [isDamaged, setIsDamaged] = useState<boolean | undefined>(undefined);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePhoto, setDamagePhoto] = useState('');
  
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when dialog opens or record changes
    if (isOpen) {
      setIsDamaged(undefined);
      setDamageDescription('');
      setDamagePhoto('');
      signaturePadRef.current?.clear();
    }
  }, [isOpen, record]);

  const handleClearSignature = () => signaturePadRef.current?.clear();
  
  const handleSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Assinatura Obrigatória',
        description: 'Por favor, o responsável deve assinar para confirmar a devolução.',
      });
      return;
    }

    if (isDamaged === undefined) {
        toast({
            variant: 'destructive',
            title: 'Campo Obrigatório',
            description: 'Por favor, informe se a ferramenta foi devolvida com avaria.',
        });
        return;
    }

    if (isDamaged && !damageDescription) {
        toast({
            variant: 'destructive',
            title: 'Campo Obrigatório',
            description: 'Por favor, descreva a avaria encontrada na ferramenta.',
        });
        return;
    }

    const signature = signaturePadRef.current?.toDataURL('image/png') ?? '';
    
    onConfirm({
      isDamaged: !!isDamaged,
      damageDescription: isDamaged ? damageDescription : undefined,
      damagePhoto: isDamaged ? damagePhoto : undefined,
      signature,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDamagePhoto(e.target?.result as string);
        toast({ title: 'Foto Adicionada', description: 'A foto da avaria foi carregada.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDialogClose = (open: boolean) => {
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Devolução de Ferramenta</DialogTitle>
          <DialogDescription>
            Confirme a devolução de: <strong>{record.tool.name} ({record.tool.assetId})</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Devolvida com avaria?</Label>
            <RadioGroup
              onValueChange={(value) => setIsDamaged(value === 'yes')}
              className="flex gap-4"
              value={isDamaged === undefined ? '' : (isDamaged ? 'yes' : 'no')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="damage-yes" />
                <Label htmlFor="damage-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="damage-no" />
                <Label htmlFor="damage-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {isDamaged === true && (
            <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
              <h4 className="font-medium text-destructive">Detalhes da Avaria</h4>
              <div className="space-y-2">
                <Label htmlFor="damage-description">Descrição da Avaria (Obrigatório)</Label>
                <Textarea
                  id="damage-description"
                  placeholder="Ex: Cabo quebrado, não liga mais..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="damage-photo">Foto da Avaria (Opcional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="mr-2" />
                    {damagePhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                  </Button>
                  <Input
                    id="damage-photo"
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  {damagePhoto && <Undo className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setDamagePhoto('')} />}
                </div>
                {damagePhoto && (
                  <div className="mt-2">
                    <img src={damagePhoto} alt="Avaria" className="max-h-40 rounded-md border" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="signature">Assinatura do Responsável (Obrigatório)</Label>
                <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                    <Eraser className="mr-2 h-4 w-4" /> Limpar
                </Button>
            </div>
            <div className="rounded-md border border-input bg-background">
              <SignatureCanvas
                ref={signaturePadRef}
                penColor="black"
                canvasProps={{ id: 'signature', className: 'w-full h-[120px]' }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
