// src/components/FileUpload.jsx
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * Props:
 * - onFilesUploaded(files) -> optional
 * - onProcessingStatusChange(status) -> optional ("idle"|"processing"|"completed")
 * - onDataProcessed(data) -> optional
 */
export default function FileUpload({
  onFilesUploaded = () => {},
  onProcessingStatusChange = () => {},
  onDataProcessed = () => {},
}) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesUploaded(newFiles);
      setError(null);
    },
    [files, onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  useEffect(() => {
    // cleanup if you create object URLs later
    return () => {};
  }, []);

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    onProcessingStatusChange("processing");
    setProcessingProgress(0);

    // visual progress simulation
    const progressInterval = setInterval(() => {
      setProcessingProgress((p) => Math.min(90, p + 10));
    }, 200);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      // TODO: replace with your backend endpoint
      const resp = await fetch("/api/process-files", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error("Server returned an error while processing files");
      }

      const data = await resp.json();

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // small delay for UX
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        onProcessingStatusChange("completed");
        onDataProcessed(data);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err?.message || "Processing failed");
      setIsProcessing(false);
      setProcessingProgress(0);
      onProcessingStatusChange("idle");
    }
  };

  const getFileIcon = (file) => {
    if (!file) return "📝";
    if (file.type.includes("pdf")) return "📄";
    if (file.name?.endsWith?.(".xlsx") || file.name?.endsWith?.(".xls")) return "📊";
    if (file.type.includes("csv")) return "📈";
    return "📝";
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="border-2 border-dashed rounded-lg p-6 hover:border-indigo-400 transition">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer ${isDragActive ? "text-indigo-600" : "text-gray-700"}`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Upload className={`h-8 w-8 ${isDragActive ? "text-indigo-600" : "text-gray-400"}`} />
          </div>

          {isDragActive ? (
            <p className="text-lg font-medium text-indigo-600">Drop files here</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900">Drag & drop files or click to browse</p>
              <p className="text-sm text-gray-500 mb-2">Supports: PDF, TXT, CSV, XLSX (max 10MB)</p>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border rounded bg-white text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="h-4 w-4 mr-2" /> Choose Files
              </button>
            </>
          )}
        </div>
      </div>

      {/* Uploaded list */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Uploaded Files ({files.length})</h3>
            <div className="text-sm text-gray-500">Review before processing</div>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between border p-2 rounded">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getFileIcon(file)}</div>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-xs px-2 py-1 bg-gray-100 rounded">{file.type || "Unknown"}</div>
                  <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          {isProcessing ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
              <div className="mt-3">Processing files... </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Process Files with AI
              </button>
              <div className="text-sm text-gray-500 mt-2">Start AI analysis to extract insights</div>
            </div>
          )}

          {error && (
            <div className="mt-3 text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
