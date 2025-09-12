'use server';

/**
 * @fileOverview An AI agent that infers the severity of a reported issue based on the description.
 *
 * - inferIssueSeverity - A function that infers the severity of a reported issue.
 * - InferIssueSeverityInput - The input type for the inferIssueSeverity function.
 * - InferIssueSeverityOutput - The return type for the inferIssueSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InferIssueSeverityInputSchema = z.object({
  issueDescription: z
    .string()
    .describe('The description of the issue reported by the user.'),
});
export type InferIssueSeverityInput = z.infer<typeof InferIssueSeverityInputSchema>;

const InferIssueSeverityOutputSchema = z.object({
  severity: z
    .enum(['low', 'medium', 'high'])
    .describe('The inferred severity of the issue (low, medium, or high).'),
});
export type InferIssueSeverityOutput = z.infer<typeof InferIssueSeverityOutputSchema>;

export async function inferIssueSeverity(input: InferIssueSeverityInput): Promise<InferIssueSeverityOutput> {
  return inferIssueSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inferIssueSeverityPrompt',
  input: {schema: InferIssueSeverityInputSchema},
  output: {schema: InferIssueSeverityOutputSchema},
  prompt: `You are an AI assistant that determines the severity of a reported issue based on the user's description.  The severity can be "low", "medium", or "high".

Issue Description: {{{issueDescription}}}

Determine the severity of the issue based on the description. Return ONLY the severity. DO NOT include any other text in your response.`,
});

const inferIssueSeverityFlow = ai.defineFlow(
  {
    name: 'inferIssueSeverityFlow',
    inputSchema: InferIssueSeverityInputSchema,
    outputSchema: InferIssueSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
