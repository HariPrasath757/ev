'use server';

/**
 * @fileOverview A flow for sending a billing receipt to a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

// Configure the email transport using environment variables.
// In a real application, these would be set in your deployment environment.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your SMTP username
    pass: process.env.EMAIL_PASS, // Your SMTP password or App Password
  },
});


const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified address with a subject and body.',
    inputSchema: z.object({
      to: z.string().email().describe("The recipient's email address."),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The plain text body of the email.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    // Verify that the necessary environment variables are set.
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const errorMessage = 'Email service is not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.';
      console.error(errorMessage);
      // Fallback to logging the email to the console if not configured.
      console.log('--- Email Simulation (Not Sent) ---');
      console.log(`To: ${input.to}`);
      console.log(`Subject: ${input.subject}`);
      console.log('Body:');
      console.log(input.body);
      console.log('--- End of Simulation ---');
      return { success: false, error: errorMessage };
    }

    try {
      const mailOptions = {
        from: `"EvolveNet Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`, // sender address
        to: input.to,
        subject: input.subject,
        text: input.body,
        html: `<pre style="font-family: Arial, sans-serif;">${input.body}</pre>`, // For better formatting in email clients
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${input.to}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
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
    const { driverName, driverEmail, stationName, vehicleName, startTime, endTime, unitsConsumed, cost, platformFee, totalBill } = input;

    const subject = `EV Charging Receipt – ${stationName}`;
    const body = `
Hello ${driverName},

Thank you for using ${stationName}. This receipt has been sent to ${driverEmail}.

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
    
    // The flow will return success even if the email fails,
    // as the primary action (billing) was completed.
    // The error is logged by the tool.
    return { success: output.success };
  }
);
