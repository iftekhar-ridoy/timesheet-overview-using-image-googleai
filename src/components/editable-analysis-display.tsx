"use client";

import { useState, useTransition } from "react";
import type { IdentifyHourVarianceOutput } from "@/ai/flows/identify-hour-variance";
import { updateSummary } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  Edit,
  Save,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface EditableAnalysisDisplayProps {
  result: IdentifyHourVarianceOutput;
  onUpdate: (updatedResult: IdentifyHourVarianceOutput) => void;
}

interface EditableDay {
  date: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  overtime: number;
  dueTime: number;
  status: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  unit,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  unit: string;
  colorClass?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {unit}
        </span>
      </div>
    </CardContent>
  </Card>
);

// Helper function to calculate duration between two times
function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  let diff = endTotalMinutes - startTotalMinutes;

  if (diff < 0) {
    diff += 24 * 60;
  }

  return diff / 60;
}

export function EditableAnalysisDisplay({
  result,
  onUpdate,
}: EditableAnalysisDisplayProps) {
  const [editableDays, setEditableDays] = useState<EditableDay[]>(
    result.dailyHours
  );
  const [currentResult, setCurrentResult] =
    useState<IdentifyHourVarianceOutput>(result);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setTempStartTime(editableDays[index].startTime);
    setTempEndTime(editableDays[index].endTime);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setTempStartTime("");
    setTempEndTime("");
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleEditSave = (index: number) => {
    if (
      !validateTimeFormat(tempStartTime) ||
      !validateTimeFormat(tempEndTime)
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Time Format",
        description: "Please use HH:MM format (e.g., 09:30)",
      });
      return;
    }

    const workingHours = calculateHours(tempStartTime, tempEndTime);

    if (workingHours < 0 || workingHours > 24) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description:
          "Please ensure the end time is after the start time and within 24 hours.",
      });
      return;
    }

    const overtime = Math.max(0, workingHours - 9);
    const dueTime = Math.max(0, 9 - workingHours);
    let status = "OK";
    if (workingHours > 9) status = "Overtime";
    if (workingHours < 9) status = "Missing";

    const updatedDays = [...editableDays];
    updatedDays[index] = {
      ...updatedDays[index],
      startTime: tempStartTime,
      endTime: tempEndTime,
      workingHours,
      overtime,
      dueTime,
      status,
    };

    setEditableDays(updatedDays);
    setEditingIndex(null);
    setTempStartTime("");
    setTempEndTime("");

    // Recalculate totals
    const totalHours = updatedDays.reduce(
      (sum, day) => sum + day.workingHours,
      0
    );
    const overtimeHours = updatedDays.reduce(
      (sum, day) => sum + day.overtime,
      0
    );
    const missingHours = updatedDays.reduce((sum, day) => sum + day.dueTime, 0);
    const totalWorkingDays = updatedDays.length;
    const totalRequiredHours = totalWorkingDays * 9;

    const updatedResult: IdentifyHourVarianceOutput = {
      ...result,
      dailyHours: updatedDays,
      totalHours,
      overtimeHours,
      missingHours,
      totalWorkingDays,
      totalRequiredHours,
    };

    setCurrentResult(updatedResult);
    onUpdate(updatedResult);

    toast({
      title: "Times Updated",
      description: "The timesheet has been updated and overview recalculated.",
    });
  };

  const handleUpdateSummary = () => {
    startTransition(async () => {
      const summaryResult = await updateSummary(currentResult);
      if (summaryResult.success) {
        const updatedResultWithSummary = {
          ...currentResult,
          summary: summaryResult.summary,
        };
        setCurrentResult(updatedResultWithSummary);
        onUpdate(updatedResultWithSummary);
        toast({
          title: "Summary Updated",
          description: "AI has generated a new summary based on your changes.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Summary Update Failed",
          description: summaryResult.error,
        });
      }
    });
  };

  const chartData = editableDays.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    }),
    expected: 9,
  }));

  const chartConfig = {
    workingHours: {
      label: "Worked Hours",
      color: "hsl(var(--primary))",
    },
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
      num
    );
  };

  // Recalculate totals based on current editable days
  const currentTotalHours = editableDays.reduce(
    (sum, day) => sum + day.workingHours,
    0
  );
  const currentOvertimeHours = editableDays.reduce(
    (sum, day) => sum + day.overtime,
    0
  );
  const currentMissingHours = editableDays.reduce(
    (sum, day) => sum + day.dueTime,
    0
  );
  const currentTotalWorkingDays = editableDays.length;
  const currentTotalRequiredHours = currentTotalWorkingDays * 9;

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total Worked Hours"
          value={formatNumber(currentTotalHours)}
          unit="hours"
          icon={Clock}
        />
        <StatCard
          title="Total Required"
          value={formatNumber(currentTotalRequiredHours)}
          unit="hours"
          icon={Target}
        />
        <StatCard
          title="Total Working Days"
          value={currentTotalWorkingDays}
          unit="days"
          icon={CalendarDays}
        />
        <StatCard
          title="Overtime"
          value={formatNumber(currentOvertimeHours)}
          unit="hours"
          icon={TrendingUp}
          colorClass="text-accent-foreground"
        />
        <StatCard
          title="Missing Hours"
          value={formatNumber(currentMissingHours)}
          unit="hours"
          icon={TrendingDown}
          colorClass="text-destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Work Hours</CardTitle>
          <CardDescription>
            A visual breakdown of your work hours per day against the 9-hour
            target.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  unit="h"
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend />
                <ReferenceLine
                  y={9}
                  label={{
                    value: "9h Target",
                    position: "insideTopLeft",
                    fill: "hsl(var(--foreground))",
                    fontSize: 10,
                  }}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                />
                <Bar
                  dataKey="workingHours"
                  name="Worked Hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>
              Click the edit button to modify in-time and out-time for any day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>In Time</TableHead>
                  <TableHead>Out Time</TableHead>
                  <TableHead className="text-right">Working Time</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Due Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableDays.map((day, index) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {new Date(day.date).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          value={tempStartTime}
                          onChange={(e) => setTempStartTime(e.target.value)}
                          placeholder="HH:MM"
                          className="w-20"
                        />
                      ) : (
                        day.startTime
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          value={tempEndTime}
                          onChange={(e) => setTempEndTime(e.target.value)}
                          placeholder="HH:MM"
                          className="w-20"
                        />
                      ) : (
                        day.endTime
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.workingHours)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.overtime)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.dueTime)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {editingIndex === index ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>
                The AI's analysis of your timesheet.
              </CardDescription>
            </div>
            <Button
              onClick={handleUpdateSummary}
              disabled={isPending}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isPending ? "Updating..." : "Update Summary"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground prose prose-sm max-w-none">
          <p>{currentResult.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
