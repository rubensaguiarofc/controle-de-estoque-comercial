
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function ToolManagement() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Controle de Ferramentas</CardTitle>
        <CardDescription>
          Gerencie a retirada e devolução de ferramentas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
