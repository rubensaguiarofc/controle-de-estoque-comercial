'use server';
/**
 * @fileOverview Extracts contact details (Who and For Whom) from a text description or photo using AI.
 *
 * - extractContactDetails - A function that handles the contact details extraction process.
 * - ExtractContactDetailsInput - The input type for the extractContactDetails function.
 * - ExtractContactDetailsOutput - The return type for the extractContactDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractContactDetailsInputSchema = z.object({
  description: z.string().describe('A text description containing contact information.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo containing contact information, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ExtractContactDetailsInput = z.infer<typeof ExtractContactDetailsInputSchema>;

const ExtractContactDetailsOutputSchema = z.object({
  quem: z.string().describe('The name of the person who authorized the withdrawal (Who).'),
  paraQuem: z.string().describe('The name/department for whom the item is being withdrawn (For Whom).'),
});
export type ExtractContactDetailsOutput = z.infer<typeof ExtractContactDetailsOutputSchema>;

export async function extractContactDetails(input: ExtractContactDetailsInput): Promise<ExtractContactDetailsOutput> {
  return extractContactDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractContactDetailsPrompt',
  input: {schema: ExtractContactDetailsInputSchema},
  output: {schema: ExtractContactDetailsOutputSchema},
  prompt: `You are an AI assistant designed to extract contact details from a given text description or photo.

  Please extract the 'Quem' (Who - person authorizing the withdrawal) and 'Para Quem' (For Whom - the person or department receiving the item) from the following information.
  If a photo is provided use it to enhance contact detail extraction.  If the person authorizing and the person receiving are the same, then the 'Quem' and 'Para Quem' fields should be the same.

  Description: {{{description}}}
  {{#if photoDataUri}}
  Photo: {{media url=photoDataUri}}
  {{/if}}
  `,
});

const extractContactDetailsFlow = ai.defineFlow(
  {
    name: 'extractContactDetailsFlow',
    inputSchema: ExtractContactDetailsInputSchema,
    outputSchema: ExtractContactDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
