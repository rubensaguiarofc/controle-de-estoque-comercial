'use server';

import { extractItemDetails } from '@/ai/flows/extract-item-details-from-description';
import { extractContactDetails } from '@/ai/flows/extract-contact-details-from-description';

type AutofillResult = {
  itemName?: string;
  identificationNumber?: string;
  specifications?: string;
  quem?: string;
  paraQuem?: string;
};

export async function autofillFromDescription(
  description: string,
  photoDataUri?: string
): Promise<AutofillResult> {
  try {
    // Run both AI flows in parallel for efficiency
    const [itemDetailsResult, contactDetailsResult] = await Promise.allSettled([
      extractItemDetails({ description, photoDataUri }),
      extractContactDetails({ description, photoDataUri }),
    ]);

    const itemDetails = itemDetailsResult.status === 'fulfilled' ? itemDetailsResult.value : {};
    const contactDetails = contactDetailsResult.status === 'fulfilled' ? contactDetailsResult.value : {};

    return { ...itemDetails, ...contactDetails };
  } catch (error) {
    console.error('Error during AI autofill:', error);
    // Return an empty object or a structured error to be handled by the client
    return {
      error: 'Failed to process AI autofill.',
    } as any;
  }
}
