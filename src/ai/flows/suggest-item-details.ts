'use server';
/**
 * @fileOverview Um fluxo de IA para sugerir detalhes de um item de estoque a partir de uma foto.
 *
 * - suggestItemDetails - Uma função que analisa uma imagem e sugere nome e especificações.
 * - SuggestItemDetailsInput - O tipo de entrada para a função suggestItemDetails.
 * - SuggestItemDetailsOutput - O tipo de retorno para a função suggestItemDetails.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestItemDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de um item, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestItemDetailsInput = z.infer<typeof SuggestItemDetailsInputSchema>;

const SuggestItemDetailsOutputSchema = z.object({
  name: z.string().describe('O nome sugerido para o item.'),
  specifications: z.string().describe('As especificações técnicas sugeridas para o item.'),
});
export type SuggestItemDetailsOutput = z.infer<typeof SuggestItemDetailsOutputSchema>;

export async function suggestItemDetails(input: SuggestItemDetailsInput): Promise<SuggestItemDetailsOutput> {
  return suggestItemDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemDetailsPrompt',
  input: { schema: SuggestItemDetailsInputSchema },
  output: { schema: SuggestItemDetailsOutputSchema },
  prompt: `Você é um especialista em catalogação de inventário. Sua tarefa é analisar a imagem de um item e fornecer um nome conciso e especificações técnicas relevantes para um sistema de controle de estoque.

Analise a imagem fornecida e retorne o nome e as especificações do item.

Imagem: {{media url=photoDataUri}}`,
});

const suggestItemDetailsFlow = ai.defineFlow(
  {
    name: 'suggestItemDetailsFlow',
    inputSchema: SuggestItemDetailsInputSchema,
    outputSchema: SuggestItemDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
