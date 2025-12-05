# Importação de Itens (CSV/XLSX)

Este guia explica o modelo de planilha e a sequência correta para cadastrar itens em massa na aba Itens.

## Modelo recomendado

Use a planilha com as seguintes colunas (nessa ordem):

1. Nome (obrigatório)
2. Especificações (obrigatório)
3. Quantidade (opcional; padrão 0)
4. Código (opcional; código de barras/etiqueta)

Você pode baixar um modelo pronto em CSV:

- /templates/estoque-import-template.csv (acesse via navegador quando o app estiver rodando)

## Cabeçalhos aceitos

Os títulos são reconhecidos em PT/EN (case-insensitive, com/sem acentos):

- Nome | name
- Especificações | especificacoes | especificações | specifications
- Quantidade | quantity
- Código | codigo | código | barcode

## Regras de validação

- Nome e Especificações: obrigatórios; serão convertidos para MAIÚSCULAS e espaços normalizados.
- Quantidade: número inteiro entre 0 e 5000 (limite de `MAX_QUANTITY`).
- Duplicados: itens com o mesmo Nome (normalizado) são ignorados na importação.
- IDs: gerados automaticamente (padrão `ITM-XYZ`).

## Como importar

1. Acesse a aba Itens.
2. Clique em "Importar Planilha".
3. Selecione seu arquivo `.csv` ou `.xlsx`.
4. Aguarde o processamento; ao final, um aviso informa quantos itens foram adicionados e quantos foram ignorados como duplicados.

Dica: prefira arquivos com a primeira planilha contendo os dados.

## Boas práticas

- Separe por lotes para manter a interface responsiva (ex.: até 500 linhas por arquivo).
- Use o modelo CSV para evitar problemas de formatação do Excel.
- Verifique colunas e ortografia dos cabeçalhos.

## Mensagens comuns

- "Planilha vazia": nenhum dado foi lido na primeira planilha.
- "Colunas ausentes": Nome/Especificações não encontrados.
- "Importação concluída": mostra contagem de adicionados/ignorados.

## Suporte

Se precisar validar mais campos (ex.: categorias, unidades) ou atualizar itens existentes ao invés de ignorar duplicados, peça para habilitarmos essas opções no importador.
