"use client";

import { useState, useTransition } from "react";
import { runAnalysis } from "@/app/actions";
import type { IdentifyHourVarianceOutput } from "@/ai/flows/identify-hour-variance";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/file-uploader";
import { AnalysisDisplay } from "@/components/analysis-display";
import { EditableAnalysisDisplay } from "@/components/editable-analysis-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Edit, Eye } from "lucide-react";

type Step = "upload" | "analyzing" | "results";

export function TimesheetDashboard() {
  const [step, setStep] = useState<Step>("upload");
  const [fileData, setFileData] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<IdentifyHourVarianceOutput | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileSelect = (file: File, dataUrl: string) => {
    setFileData({ file, dataUrl });
  };

  const handleAnalyze = () => {
    if (!fileData) return;

    setStep("analyzing");
    startTransition(async () => {
      const result = await runAnalysis(fileData.dataUrl);
      if (result.success) {
        setAnalysisResult(result.data);
        setStep("results");
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.error,
        });
        setStep("upload");
      }
    });
  };

  const handleReset = () => {
    setStep("upload");
    setFileData(null);
    setAnalysisResult(null);
    setIsEditMode(false);
  };

  const handleAnalysisUpdate = (updatedResult: IdentifyHourVarianceOutput) => {
    setAnalysisResult(updatedResult);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const isLoading = isPending || step === "analyzing";
  console.log("analysisResult:", analysisResult);
  return (
    <Card className="w-full transition-all duration-500 ease-in-out shadow-lg">
      <CardContent className="p-6">
        {step === "upload" && (
          <div className="flex flex-col items-center gap-6">
            <FileUploader
              onFileSelect={handleFileSelect}
              file={fileData?.file}
            />
            <Button
              onClick={handleAnalyze}
              disabled={!fileData || isLoading}
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Analyze Timesheet
            </Button>
          </div>
        )}

        {isLoading && step === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-semibold">
              Analyzing your timesheet...
            </h2>
            <p className="text-muted-foreground">
              The AI is working its magic. This might take a moment.
            </p>
          </div>
        )}

        {step === "results" && analysisResult && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Timesheet Analysis</h2>
              <Button
                onClick={toggleEditMode}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4" />
                    View Mode
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Times
                  </>
                )}
              </Button>
            </div>

            {isEditMode ? (
              <EditableAnalysisDisplay
                result={analysisResult}
                onUpdate={handleAnalysisUpdate}
              />
            ) : (
              <AnalysisDisplay result={analysisResult} />
            )}

            <div className="mt-8 text-center">
              <Button onClick={handleReset} variant="outline" size="lg">
                Analyze Another Timesheet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
