"use client"

import { useState } from "react"
import { LogOut, User, Shield, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useAuth } from "@/firebase/provider"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useUser()
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (!auth) return
    
    try {
      setLoggingOut(true)
      await signOut(auth)
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      onOpenChange(false)
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoggingOut(false)
    }
  }

  const loginEnabled = process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie sua conta e preferências do aplicativo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Conta */}
          {loginEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">E-mail</div>
                      <div className="text-sm font-medium">{user.email}</div>
                    </div>
                    
                    {user.displayName && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Nome</div>
                        <div className="text-sm font-medium">{user.displayName}</div>
                      </div>
                    )}

                    <Separator />
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {loggingOut ? "Saindo..." : "Sair da conta"}
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Você não está conectado
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sobre o App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Sobre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Nome do App</div>
                <div className="text-sm font-medium">Controle de Estoque</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Versão</div>
                <div className="text-sm font-medium">2.0.0</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Desenvolvedor</div>
                <div className="text-sm font-medium">Rubens Aguiar</div>
              </div>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => {
                  onOpenChange(false)
                  router.push("/privacy-policy")
                }}
              >
                Ver Política de Privacidade
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
