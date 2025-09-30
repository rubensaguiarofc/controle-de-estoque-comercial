
"use client";

import type { ToolRecord } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface SignatureDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  record: ToolRecord | null;
}

export function SignatureDisplayDialog({ isOpen, onOpenChange, record }: SignatureDisplayDialogProps) {
    if (!record) return null;

    const { tool, checkedOutBy, checkoutDate, checkoutSignature, returnDate, returnSignature, isDamaged } = record;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Assinaturas do Registro</DialogTitle>
                    <DialogDescription>
                        Visualizando assinaturas para: <strong>{tool.name} ({tool.assetId})</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
                    {/* Checkout Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assinatura de Retirada</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="aspect-video w-full bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                                {checkoutSignature ? (
                                    <img src={checkoutSignature} alt="Assinatura de Retirada" className="w-full h-full object-contain" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">Sem assinatura</p>
                                )}
                            </div>
                            <Separator />
                            <p className="text-sm"><strong>Responsável:</strong> {checkedOutBy}</p>
                            <p className="text-sm text-muted-foreground">
                                <strong>Data:</strong> {new Date(checkoutDate).toLocaleString('pt-BR')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Return Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assinatura de Devolução</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <div className="aspect-video w-full bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                                {returnSignature ? (
                                    <img src={returnSignature} alt="Assinatura de Devolução" className="w-full h-full object-contain" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aguardando devolução</p>
                                )}
                            </div>
                            <Separator />
                            <p className="text-sm"><strong>Status:</strong> {isDamaged ? 'Devolvido com Avaria' : 'Devolvido OK'}</p>
                             <p className="text-sm text-muted-foreground">
                                <strong>Data:</strong> {returnDate ? new Date(returnDate).toLocaleString('pt-BR') : '—'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
