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
  barcode: z.string().describe('O número do código de barras extraído da imagem. Deve conter apenas dígitos.'),
});
export type ReadBarcodeFromImageOutput = z
  .infer<typeof ReadBarcodeFromImageOutputSchema>;

export async function readBarcodeFromImage(
  input: ReadBarcodeFromImageInput
): Promise<ReadBarcodeFromImageOutput> {
  return readBarcodeFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readBarcodeFromImagePrompt',
  input: {schema: ReadBarcodeFromImageInputSchema},
  output: {schema: ReadBarcodeFromImageOutputSchema},
  prompt: `Você é um especialista em OCR otimizado para ler os números na parte inferior dos códigos de barras. Analise a imagem fornecida e extraia a sequência numérica do código de barras. Retorne apenas os dígitos.

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
