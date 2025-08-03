'use server';

import {
  extractTimesheetData,
  type ExtractTimesheetDataOutput,
} from '@/ai/flows/extract-timesheet-data';
import {
  identifyHourVariance,
  type IdentifyHourVarianceOutput,
} from '@/ai/flows/identify-hour-variance';

// Helper function to calculate duration between two times
function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  let diff = endTotalMinutes - startTotalMinutes;
  
  // Handle overnight case if necessary, though current prompt logic tries to prevent this.
  // For "10:30 - 10:32" interpreted as "10:30 AM" to "10:32 PM" (22:32), this is handled.
  if (diff < 0) {
     // This case shouldn't happen with the current prompt logic for AM/PM inference
     diff += 24 * 60;
  }
  
  return diff / 60;
}


export async function runAnalysis(
  timesheetDataUri: string
): Promise<{ success: true; data: IdentifyHourVarianceOutput } | { success: false; error: string }> {
  try {
    if (!timesheetDataUri) {
      return { success: false, error: 'No timesheet image provided.' };
    }

    // Step 1: Extract data from the image
    const extractedResult = await extractTimesheetData({ photoDataUri: timesheetDataUri });
    if (!extractedResult || !extractedResult.entries || extractedResult.entries.length === 0) {
      return { success: false, error: 'Could not extract any data from the timesheet. The image might be unclear or not a valid timesheet.' };
    }

    // Step 2: Perform calculations in code for accuracy
    const dailyHours = extractedResult.entries.map(entry => {
      const workingHours = calculateHours(entry.startTime, entry.endTime);
      const overtime = Math.max(0, workingHours - 9);
      const dueTime = Math.max(0, 9 - workingHours);
      let status = 'OK';
      if (workingHours > 9) status = 'Overtime';
      if (workingHours < 9) status = 'Missing';

      return {
        ...entry,
        workingHours,
        overtime,
        dueTime,
        status,
      };
    });

    const totalHours = dailyHours.reduce((sum, day) => sum + day.workingHours, 0);
    const overtimeHours = dailyHours.reduce((sum, day) => sum + day.overtime, 0);
    const missingHours = dailyHours.reduce((sum, day) => sum + day.dueTime, 0);
    const totalWorkingDays = dailyHours.length;
    const totalRequiredHours = totalWorkingDays * 9;
    
    const analysisInput = {
      dailyHours,
      totalHours,
      overtimeHours,
      missingHours,
      totalWorkingDays,
      totalRequiredHours,
    };

    // Step 3: Get only the summary from the AI
    const analysisResult = await identifyHourVariance({ extractedData: JSON.stringify(analysisInput) });
     if (!analysisResult) {
        return { success: false, error: 'Could not generate a summary for the timesheet data.' };
    }

    // Combine coded calculations with AI summary
    const finalData: IdentifyHourVarianceOutput = {
      ...analysisInput,
      summary: analysisResult.summary
    };


    return { success: true, data: finalData };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: `Analysis failed. Please try again with a clearer image. Details: ${errorMessage}` };
  }
}
