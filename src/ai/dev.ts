import { config } from 'dotenv';
config();

import '@/ai/flows/extract-timesheet-data.ts';
import '@/ai/flows/identify-hour-variance.ts';
