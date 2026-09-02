"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Loader2, X } from "lucide-react";
import { uploadDatasetFile } from "../lib/api";
import { UploadResponse } from "../lib/types";

interface FileUploaderProps {
  onUploadSuccess: (res: UploadResponse) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  currentFilename?: string;
  onReset?: () => void;
}

const SAMPLE_DATASETS = [
  {
    name: "Titanic Survivors",
    type: "csv",
    description: "Classification / Missing values / Demographics",
    content: `PassengerId,Survived,Pclass,Name,Sex,Age,SibSp,Parch,Fare,Embarked
1,0,3,"Braund, Mr. Owen Harris",male,22,1,0,7.25,S
2,1,1,"Cumings, Mrs. John Bradley",female,38,1,0,71.2833,C
3,1,3,"Heikkinen, Miss. Laina",female,26,0,0,7.925,S
4,1,1,"Futrelle, Mrs. Jacques Heath",female,35,1,0,53.1,S
5,0,3,"Allen, Mr. William Henry",male,35,0,0,8.05,S
6,0,3,"Moran, Mr. James",male,,0,0,8.4583,Q
7,0,1,"McCarthy, Mr. Timothy J",male,54,0,0,51.8625,S
8,0,3,"Palsson, Master. Gosta Leonard",male,2,3,1,21.075,S
9,1,3,"Johnson, Mrs. Oscar W",female,27,0,2,11.1333,S
10,1,2,"Nasser, Mrs. Nicholas",female,14,1,0,30.0708,C
11,1,3,"Sandstrom, Miss. Marguerite Rut",female,4,1,1,16.7,S
12,1,1,"Bonnell, Miss. Elizabeth",female,58,0,0,26.55,S
13,0,3,"Saundercock, Mr. William Henry",male,20,0,0,8.05,S
14,0,3,"Andersson, Mr. Anders Johan",male,39,1,5,31.275,S
15,0,3,"Vestrom, Miss. Hulda Amanda Adolfina",female,14,0,0,7.8542,S`,
  },
  {
    name: "Customer Churn & Revenue",
    type: "csv",
    description: "Telecom Churn ML / Tenure & Monthly Charges",
    content: `customerID,gender,SeniorCitizen,Partner,tenure,PhoneService,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,1,No,29.85,29.85,No
5575-GNVDE,Male,0,No,34,Yes,56.95,1889.5,No
3668-QPYBK,Male,0,No,2,Yes,53.85,108.15,Yes
7795-CFOCW,Male,0,No,45,No,42.3,1840.75,No
9237-HQITU,Female,0,No,2,Yes,70.7,151.65,Yes
9305-CDSKC,Female,0,No,8,Yes,99.65,820.5,Yes
1452-KIOVK,Male,0,No,22,Yes,89.1,1949.4,No
6713-OKOMC,Female,0,No,10,No,29.75,301.9,No
7892-POOKP,Female,0,Yes,28,Yes,104.8,3046.05,Yes
6388-TABGU,Male,0,No,62,No,56.15,3487.95,No`,
  },
  {
    name: "Sales & Profit Forecast",
    type: "csv",
    description: "Regression / Regional Sales, Discounts & Profits",
    content: `OrderDate,Region,Category,SubCategory,Sales,Quantity,Discount,Profit
2023-01-05,East,Technology,Phones,1250.00,3,0.1,250.00
2023-01-08,West,Furniture,Chairs,620.50,2,0.2,-45.00
2023-01-12,Central,Office Supplies,Binders,85.20,5,0.0,34.08
2023-01-15,South,Technology,Accessories,450.00,4,0.15,90.00
2023-01-20,East,Furniture,Tables,890.00,1,0.3,-120.00
2023-01-24,West,Technology,Machines,2100.00,2,0.0,630.00
2023-01-29,Central,Office Supplies,Paper,45.00,6,0.0,18.50
2023-02-02,South,Furniture,Furnishings,180.00,3,0.2,22.00
2023-02-06,East,Office Supplies,Storage,320.00,2,0.1,48.00
2023-02-10,West,Technology,Phones,950.00,2,0.05,210.00`,
  },
];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  isLoading,
  setIsLoading,
  currentFilename,
  onReset,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await uploadDatasetFile(file);
      if (res.success) {
        onUploadSuccess(res);
      } else {
        setErrorMessage(res.message || "Failed to parse dataset.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const detail = err.response?.data?.detail || err.message || "Error uploading dataset.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const loadSampleDataset = (sample: (typeof SAMPLE_DATASETS)[0]) => {
    const blob = new Blob([sample.content], { type: "text/csv" });
    const file = new File([blob], `${sample.name.toLowerCase().replace(/\s+/g, "_")}.csv`, {
      type: "text/csv",
    });
    handleProcessFile(file);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : currentFilename ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {currentFilename ? (
                <span className="text-emerald-400 flex items-center justify-center space-x-2">
                  <span>Loaded: {currentFilename}</span>
                </span>
              ) : (
                "Drop your dataset here, or browse files"
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="font-mono text-slate-300">.csv</span>,{" "}
              <span className="font-mono text-slate-300">.xlsx</span>,{" "}
              <span className="font-mono text-slate-300">.txt</span>,{" "}
              <span className="font-mono text-slate-300">.json</span> (delimited & tabular)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-[11px] font-medium text-slate-300 border border-slate-700">
              Auto Schema Footprint
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-[11px] font-medium text-slate-300 border border-slate-700">
              Instant df.head()
            </span>
          </div>
        </div>

        {currentFilename && onReset && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Sample Dataset Pills */}
      {!currentFilename && (
        <div className="pt-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Or test immediately with a ready sample dataset:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                disabled={isLoading}
                onClick={() => loadSampleDataset(sample)}
                className="flex flex-col text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-xs group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-slate-200 group-hover:text-indigo-300">
                    {sample.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {sample.type}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">{sample.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
