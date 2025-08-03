"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ExtractTimesheetDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a timesheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTimesheetDataInput = z.infer<
  typeof ExtractTimesheetDataInputSchema
>;

const ExtractTimesheetDataOutputSchema = z.object({
  entries: z
    .array(
      z.object({
        date: z
          .string()
          .describe("The date of the timesheet entry (YYYY-MM-DD)."),
        startTime: z
          .string()
          .describe(
            "The start time of the work period (HH:MM in 24-hour format)."
          ),
        endTime: z
          .string()
          .describe(
            "The end time of the work period (HH:MM in 24-hour format)."
          ),
      })
    )
    .describe(
      "An array of timesheet entries, each containing the date, start time, and end time."
    ),
});
export type ExtractTimesheetDataOutput = z.infer<
  typeof ExtractTimesheetDataOutputSchema
>;

export async function extractTimesheetData(
  input: ExtractTimesheetDataInput
): Promise<ExtractTimesheetDataOutput> {
  return extractTimesheetDataFlow(input);
}

const prompt = ai.definePrompt({
  name: "extractTimesheetDataPrompt",
  input: { schema: ExtractTimesheetDataInputSchema },
  output: { schema: ExtractTimesheetDataOutputSchema },
  prompt: `You are an expert data extraction specialist, skilled at reading handwritten timesheets from Bangladeshi employees.

  Your goal is to accurately extract the date, start time, and end time for each entry on the timesheet.

  The timesheet may be handwritten and the time format is often in 12-hour format (e.g., 09:10 - 6:40). You must convert these to 24-hour format.

  If AM/PM is not specified for a time range, you must assume the start time is in the morning (AM) and the end time is in the afternoon/evening (PM). For example, if an entry is "10:30 - 10:32", you should interpret it as "10:30 AM" to "10:32 PM", which is 10:30 to 22:32 in 24-hour format.

  Output the data in JSON format as an array of objects. Each object should have 'date', 'startTime', and 'endTime' fields.

  Here is the timesheet image:

  {{media url=photoDataUri}}
  `,
});

const extractTimesheetDataFlow = ai.defineFlow(
  {
    name: "extractTimesheetDataFlow",
    inputSchema: ExtractTimesheetDataInputSchema,
    outputSchema: ExtractTimesheetDataOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
