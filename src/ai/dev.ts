import { config } from 'dotenv';
config();

import '@/ai/flows/infer-issue-severity.ts';
import '@/ai/flows/send-receipt-flow.ts';
