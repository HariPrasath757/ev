'use server';

import { inferIssueSeverity } from '@/ai/flows/infer-issue-severity';
import { addReport } from '@/lib/firebase/database';

export async function handleReportSubmit({
  issueDescription,
  stationId,
  userId,
}: {
  issueDescription: string;
  stationId: string;
  userId: string;
}) {
  try {
    const { severity } = await inferIssueSeverity({ issueDescription });

    const report = {
      stationId,
      issue: issueDescription,
      timestamp: new Date().toISOString(),
      userId,
      status: 'open',
      severity,
    };

    await addReport(report);

    return { success: true, message: 'Issue reported successfully.' };
  } catch (error) {
    console.error('Error reporting issue:', error);
    return { success: false, message: 'Failed to report issue.' };
  }
}
