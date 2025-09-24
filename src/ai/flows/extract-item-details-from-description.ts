'use server';
/**
 * @fileOverview Extracts item details from a text description or image using Genkit.
 * 
 * This file defines a Genkit flow that takes either a text description or an image (as a data URI)
 * of an item and uses an LLM to extract relevant details such as item name, identification number,
 * and specifications. The extracted details are then returned as a structured object.
 *
 * @interface ExtractItemDetailsInput - The input type for the extractItemDetails function.
 * @interface ExtractItemDetailsOutput - The output type for the extractItemDetails function.
 * @function extractItemDetails - The main function that triggers the flow and returns the extracted item details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractItemDetailsInputSchema = z.object({
  description: z
    .string()
    .optional()
    .describe('A text description of the item.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractItemDetailsInput = z.infer<typeof ExtractItemDetailsInputSchema>;

const ExtractItemDetailsOutputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  identificationNumber: z
    .string()
    .describe('The identification number of the item.'),
  specifications: z.string().describe('The specifications of the item.'),
});
export type ExtractItemDetailsOutput = z.infer<typeof ExtractItemDetailsOutputSchema>;

export async function extractItemDetails(
  input: ExtractItemDetailsInput
): Promise<ExtractItemDetailsOutput> {
  return extractItemDetailsFlow(input);
}

const extractItemDetailsPrompt = ai.definePrompt({
  name: 'extractItemDetailsPrompt',
  input: {schema: ExtractItemDetailsInputSchema},
  output: {schema: ExtractItemDetailsOutputSchema},
  prompt: `You are an expert inventory specialist. Extract the item name, identification number, and specifications from the following item description and/or photo.

  Description: {{{description}}}
  Photo: {{#if photoDataUri}}{{media url=photoDataUri}}{{else}}No photo provided{{/if}}
  
  If you cannot determine a field, use "unknown".`,
});

const extractItemDetailsFlow = ai.defineFlow(
  {
    name: 'extractItemDetailsFlow',
    inputSchema: ExtractItemDetailsInputSchema,
    outputSchema: ExtractItemDetailsOutputSchema,
  },
  async input => {
    const {output} = await extractItemDetailsPrompt(input);
    return output!;
  }
);

