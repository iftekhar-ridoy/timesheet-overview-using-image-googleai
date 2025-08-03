"use client";

import type { IdentifyHourVarianceOutput } from "@/ai/flows/identify-hour-variance";
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
import {
  CalendarDays,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
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

interface AnalysisDisplayProps {
  result: IdentifyHourVarianceOutput;
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

export function AnalysisDisplay({ result }: AnalysisDisplayProps) {
  const chartData = result.dailyHours.map((d) => ({
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

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total Worked Hours"
          value={formatNumber(result.totalHours)}
          unit="hours"
          icon={Clock}
        />
        <StatCard
          title="Total Required"
          value={formatNumber(result.totalRequiredHours)}
          unit="hours"
          icon={Target}
        />
        <StatCard
          title="Total Working Days"
          value={result.totalWorkingDays}
          unit="days"
          icon={CalendarDays}
        />
        <StatCard
          title="Overtime"
          value={formatNumber(result.overtimeHours)}
          unit="hours"
          icon={TrendingUp}
          colorClass="text-accent-foreground"
        />
        <StatCard
          title="Missing Hours"
          value={formatNumber(result.missingHours)}
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
            <CardDescription>A detailed look at each workday.</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.dailyHours.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {new Date(day.date).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{day.startTime}</TableCell>
                    <TableCell>{day.endTime}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.workingHours)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.overtime)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.dueTime)}h
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
          <CardTitle>AI Summary</CardTitle>
          <CardDescription>
            The AI's analysis of your timesheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground prose prose-sm max-w-none">
          <p>{result.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
