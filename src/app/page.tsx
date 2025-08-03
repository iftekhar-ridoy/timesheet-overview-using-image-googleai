import { TimesheetDashboard } from '@/components/timesheet-dashboard';

export default function Home() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="mx-auto max-w-4xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold font-headline tracking-tight text-primary sm:text-5xl">
              TimeWise Assistant
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload your handwritten timesheet and get an instant analysis of your work hours.
            </p>
          </header>

          <TimesheetDashboard />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground">
        <p>Powered by GenAI. Built for Bangladeshi employees.</p>
      </footer>
    </div>
  );
}
