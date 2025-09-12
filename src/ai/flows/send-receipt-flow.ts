'use server';

/**
 * @fileOverview A flow for sending a billing receipt to a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a tool to "send" an email. In a real app, this would use a service like SendGrid or AWS SES.
// For this prototype, it just logs the email content to the console.
const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified address with a subject and body.',
    inputSchema: z.object({
      to: z.string().email().describe('The recipient\'s email address.'),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The plain text body of the email.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async (input) => {
    console.log('--- Sending Email ---');
    console.log(`To: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log('Body:');
    console.log(input.body);
    console.log('--- Email Sent (Simulated) ---');
    // Simulate a successful email send.
    return { success: true };
  }
);


const SendReceiptInputSchema = z.object({
  stationName: z.string(),
  driverName: z.string(),
  driverEmail: z.string().email(),
  vehicleName: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  unitsConsumed: z.number(),
  cost: z.number(),
  platformFee: z.number(),
  totalBill: z.number(),
});
export type SendReceiptInput = z.infer<typeof SendReceiptInputSchema>;

export async function sendReceipt(input: SendReceiptInput): Promise<{ success: boolean }> {
  return sendReceiptFlow(input);
}


const sendReceiptFlow = ai.defineFlow(
  {
    name: 'sendReceiptFlow',
    inputSchema: SendReceiptInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    const { driverName, stationName, vehicleName, startTime, endTime, unitsConsumed, cost, platformFee, totalBill } = input;

    const subject = `EV Charging Receipt – ${stationName}`;
    const body = `
Hello ${driverName},

Thank you for using ${stationName}.

Vehicle: ${vehicleName}
Charging Duration: ${new Date(startTime).toLocaleString()} – ${new Date(endTime).toLocaleString()}
Units Charged: ${unitsConsumed.toFixed(2)} kWh
Cost: ₹${cost.toFixed(2)}
Partner Fee (5%): ₹${platformFee.toFixed(2)}
Total Bill: ₹${totalBill.toFixed(2)}

A copy of this receipt has been recorded under your account.

Regards,
EvolveNet Platform
    `.trim();

    const { output } = await ai.runTool(sendEmailTool, {
      to: input.driverEmail,
      subject,
      body,
    });
    
    return { success: output.success };
  }
);
