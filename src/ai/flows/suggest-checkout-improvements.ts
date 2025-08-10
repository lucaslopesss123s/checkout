'use server';

/**
 * @fileOverview An AI agent that suggests improvements to the checkout conversion funnel.
 *
 * - suggestCheckoutImprovements - A function that handles the process of suggesting checkout improvements.
 * - SuggestCheckoutImprovementsInput - The input type for the suggestCheckoutImprovements function.
 * - SuggestCheckoutImprovementsOutput - The return type for the suggestCheckoutImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCheckoutImprovementsInputSchema = z.object({
  paymentTypes: z
    .array(z.string())
    .describe('The payment types available in the checkout flow.'),
  cartSize: z.number().describe('The size of the cart (number of items).'),
  currentCheckoutFunnel: z
    .string()
    .describe('The current checkout funnel description.'),
});
export type SuggestCheckoutImprovementsInput = z.infer<
  typeof SuggestCheckoutImprovementsInputSchema
>;

const SuggestCheckoutImprovementsOutputSchema = z.object({
  suggestedImprovements: z
    .string()
    .describe(
      'A list of suggested improvements to the checkout conversion funnel.'
    ),
});
export type SuggestCheckoutImprovementsOutput = z.infer<
  typeof SuggestCheckoutImprovementsOutputSchema
>;

export async function suggestCheckoutImprovements(
  input: SuggestCheckoutImprovementsInput
): Promise<SuggestCheckoutImprovementsOutput> {
  return suggestCheckoutImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCheckoutImprovementsPrompt',
  input: {schema: SuggestCheckoutImprovementsInputSchema},
  output: {schema: SuggestCheckoutImprovementsOutputSchema},
  prompt: `You are an expert in e-commerce checkout optimization.

  Given the following information about the current checkout funnel, payment types, and cart size, suggest improvements to increase conversion rates.

Current Checkout Funnel: {{{currentCheckoutFunnel}}}
Payment Types: {{#each paymentTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Cart Size: {{{cartSize}}}

Suggested Improvements:`,
});

const suggestCheckoutImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCheckoutImprovementsFlow',
    inputSchema: SuggestCheckoutImprovementsInputSchema,
    outputSchema: SuggestCheckoutImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
