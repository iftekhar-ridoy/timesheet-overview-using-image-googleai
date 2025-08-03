"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const IdentifyHourVarianceInputSchema = z.object({
  extractedData: z
    .string()
    .describe(
      "The calculated timesheet data in JSON format, including daily and total hours."
    ),
});
export type IdentifyHourVarianceInput = z.infer<
  typeof IdentifyHourVarianceInputSchema
>;

const DailyHourSchema = z.object({
  date: z.string().describe("The date of the timesheet entry."),
  startTime: z.string().describe("The start time of the work period."),
  endTime: z.string().describe("The end time of the work period."),
  workingHours: z.number().describe("The working hours for the day."),
  overtime: z.number().describe("The overtime for the day."),
  dueTime: z.number().describe("The due time for the day."),
  status: z
    .string()
    .describe(
      "OK if the hours are ok, Overtime if worked more than 9 hours, Missing if less than 9 hours."
    ),
});

const IdentifyHourVarianceOutputSchema = z.object({
  dailyHours: z.array(DailyHourSchema),
  totalHours: z.number().describe("The total working hours."),
  overtimeHours: z.number().describe("The total overtime hours."),
  missingHours: z.number().describe("The total missing hours."),
  totalWorkingDays: z
    .number()
    .describe("The total number of working days in the timesheet."),
  totalRequiredHours: z
    .number()
    .describe(
      "The total required hours based on the number of working days (9 hours per day)."
    ),
  summary: z.string().describe("A summary of the work hours analysis."),
});
export type IdentifyHourVarianceOutput = z.infer<
  typeof IdentifyHourVarianceOutputSchema
>;

export async function identifyHourVariance(
  input: IdentifyHourVarianceInput
): Promise<IdentifyHourVarianceOutput> {
  return identifyHourVarianceFlow(input);
}

const prompt = ai.definePrompt({
  name: "identifyHourVariancePrompt",
  input: { schema: IdentifyHourVarianceInputSchema },
  output: { schema: IdentifyHourVarianceOutputSchema },
  prompt: `You are a time management expert.
  You will be provided with pre-calculated timesheet data for a Bangladeshi employee.
  Your task is to provide a concise, friendly summary of the work hours analysis based on the data.
  Do not perform any calculations. The data provided to you is the final data.
  You only need to generate the 'summary' field. For all other fields, you MUST return the exact data that was provided in the input.

  Pre-calculated Timesheet Data: {{{extractedData}}}

  Return the full results in JSON format, including the summary.
  `,
});

const identifyHourVarianceFlow = ai.defineFlow(
  {
    name: "identifyHourVarianceFlow",
    inputSchema: IdentifyHourVarianceInputSchema,
    outputSchema: IdentifyHourVarianceOutputSchema,
  },
  async (input) => {
    // We now expect the input to be JSON-parsable string containing the full structure.
    const parsedInput = JSON.parse(input.extractedData);

    const { output } = await prompt(input);

    if (!output) {
      throw new Error("Failed to get a summary from the AI.");
    }

    // Return the pre-calculated data from the input, but with the AI-generated summary.
    return {
      dailyHours: parsedInput.dailyHours,
      totalHours: parsedInput.totalHours,
      overtimeHours: parsedInput.overtimeHours,
      missingHours: parsedInput.missingHours,
      totalWorkingDays: parsedInput.totalWorkingDays,
      totalRequiredHours: parsedInput.totalRequiredHours,
      summary: output.summary,
    };
  }
);
