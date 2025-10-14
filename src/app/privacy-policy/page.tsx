export const metadata = {
  title: 'Política de Privacidade',
  description: 'Como tratamos dados, uso de câmera e armazenamento local.'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
      <p>
        Esta aplicação de controle de almoxarifado utiliza a câmera exclusivamente para realizar
        leitura de códigos de barras e QR Codes necessários para identificar itens e ferramentas.
      </p>
      <h2 className="text-xl font-medium">1. Dados Coletados</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>Câmera:</strong> acesso apenas em tempo real para captura/decodificação; nenhuma imagem é armazenada.</li>
        <li><strong>PDFs/Relatórios:</strong> gerados localmente no dispositivo a partir dos dados de estoque.</li>
        <li><strong>Assinaturas e registros:</strong> quando habilitado, podem ser salvos apenas localmente ou enviados ao backend configurado.</li>
      </ul>
      <h2 className="text-xl font-medium">2. Uso da Permissão de Câmera</h2>
      <p>
        A permissão <code>android.permission.CAMERA</code> é necessária para ativar o leitor de códigos. Sem esta permissão, o
        recurso de escaneamento não funciona. Não capturamos nem enviamos fotos ou vídeo para servidores.
      </p>
      <h2 className="text-xl font-medium">3. Armazenamento de Arquivos</h2>
      <p>
        PDFs e etiquetas são salvos na pasta Downloads ou compartilhados via aplicativos de terceiros. Não há leitura de arquivos
        pessoais além dos gerados pela própria aplicação. Em Android 13+ o acesso segue as novas políticas de escopo.
      </p>
      <h2 className="text-xl font-medium">4. Segurança</h2>
      <p>
        Recomendamos proteger o dispositivo com senha/biometria. Não mantemos dados sensíveis fora do backend autenticado (Firebase, se configurado).
      </p>
      <h2 className="text-xl font-medium">5. Exclusão de Dados</h2>
      <p>O usuário pode remover PDFs e registros locais manualmente. Dados em backend remoto seguem as políticas da plataforma utilizada.</p>
      <h2 className="text-xl font-medium">6. Contato</h2>
      <p>Para dúvidas ou solicitações de privacidade, entre em contato: <a href="mailto:suporte@exemplo.com" className="text-primary underline">suporte@exemplo.com</a>.</p>
      <p className="text-xs text-muted-foreground">Versão da política: 1.0. Publicado em 14/10/2025.</p>
    </main>
  );
}
