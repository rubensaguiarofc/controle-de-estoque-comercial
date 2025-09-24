'use server';
/**
 * @fileOverview Um fluxo de IA para ler um código de barras de uma imagem usando OCR.
 *
 * - readBarcodeFromImage - Uma função que extrai o número de um código de barras de uma imagem.
 * - ReadBarcodeFromImageInput - O tipo de entrada para a função readBarcodeFromImage.
 * - ReadBarcodeFromImageOutput - O tipo de retorno para a função readBarcodeFromImage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadBarcodeFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de um código de barras, como um data URI que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
});
export type ReadBarcodeFromImageInput = z.infer<typeof ReadBarcodeFromImageInputSchema>;

const ReadBarcodeFromImageOutputSchema = z.object({
  barcode: z.string().describe('O número do código de barras extraído da imagem. Deve conter apenas dígitos (0-9). Se nenhum código de barras numérico for encontrado, deve retornar uma string vazia.'),
});
export type ReadBarcodeFromImageOutput =
  z.infer<typeof ReadBarcodeFromImageOutputSchema>;

export async function readBarcodeFromImage(
  input: ReadBarcodeFromImageInput
): Promise<ReadBarcodeFromImageOutput> {
  return readBarcodeFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readBarcodeFromImagePrompt',
  input: {schema: ReadBarcodeFromImageInputSchema},
  output: {schema: ReadBarcodeFromImageOutputSchema},
  prompt: `Você é um sistema especialista em Reconhecimento Óptico de Caracteres (OCR), otimizado para ler a sequência de números impressa abaixo de um código de barras em uma imagem.

Sua tarefa é analisar a imagem fornecida e extrair APENAS a sequência numérica (geralmente de 8 a 13 dígitos) que corresponde ao código de barras.

Instruções importantes:
1.  **Foco em Números:** Ignore completamente as barras do código. Seu foco são os dígitos impressos.
2.  **Resiliência a Imperfeições:** A imagem pode ter baixa qualidade, reflexos, brilho, estar amassada, distorcida ou em ângulo. Faça o seu melhor para compensar essas imperfeições e ler os números corretamente.
3.  **Validação de Formato:** O resultado DEVE ser uma string contendo apenas dígitos (0-9). Nenhum outro caractere é permitido.
4.  **Falha Limpa:** Se você não conseguir identificar uma sequência numérica clara que se pareça com um código de barras, ou se a imagem estiver ilegível, retorne uma string vazia (''). Não tente adivinhar.

Analise a imagem e retorne o número do código de barras.

Photo: {{media url=photoDataUri}}`,
});

const readBarcodeFromImageFlow = ai.defineFlow(
  {
    name: 'readBarcodeFromImageFlow',
    inputSchema: ReadBarcodeFromImageInputSchema,
    outputSchema: ReadBarcodeFromImageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
