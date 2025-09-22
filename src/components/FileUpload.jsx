// src/components/FileUpload.jsx
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";

export default function FileUpload({ onDataProcessed = () => {} }) {
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  useEffect(() => {
    return () => {};
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0 || !prompt.trim()) {
      setError("Please upload a file and enter a prompt.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((p) => Math.min(90, p + 10));
    }, 200);

    try {
      const formData = new FormData();

      // ✅ send only the first file (backend expects single "file")
      formData.append("file", files[0]);
      formData.append("prompt", prompt);

      const resp = await fetch("http://localhost:8000/api/process-files", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status} while processing file`);
      }

      const data = await resp.json();

      clearInterval(progressInterval);
      setProcessingProgress(100);

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        onDataProcessed(data);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err?.message || "Processing failed");
      setIsProcessing(false);
      setProcessingProgress(0);
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
      <div className="p-6 transition border-2 border-dashed rounded-lg hover:border-indigo-400">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer ${isDragActive ? "text-indigo-600" : "text-gray-700"}`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
            <Upload className={`h-8 w-8 ${isDragActive ? "text-indigo-600" : "text-gray-400"}`} />
          </div>

          {isDragActive ? (
            <p className="text-lg font-medium text-indigo-600">Drop file here</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900">Drag & drop a file or click to browse</p>
              <p className="mb-2 text-sm text-gray-500">Supports: PDF, TXT, CSV (max 10MB)</p>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 text-sm bg-white border rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-4 h-4 mr-2" /> Choose File
              </button>
            </>
          )}
        </div>
      </div>

      {/* Uploaded file */}
      {files.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Uploaded File</h3>
            <div className="text-sm text-gray-500">Review before processing</div>
          </div>

          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(file)}</div>
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="px-2 py-1 text-xs bg-gray-100 rounded">{file.type || "Unknown"}</div>
                <button onClick={() => removeFile(idx)} className="p-1 text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt Box and Submission Button */}
      {files.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tell AI what to do (e.g., Analyze student performance...)"
            className="w-full p-3 mt-4 text-gray-100 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            rows={3}
          />

          {isProcessing ? (
            <div className="mt-4 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-indigo-600 animate-spin" />
              <div className="mt-3">Processing file... </div>
              <div className="w-full h-3 mt-3 bg-gray-200 rounded-full">
                <div
                  className="h-3 transition-all bg-indigo-600 rounded-full"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 text-white bg-indigo-600 rounded"
              >
                Submit Prompt
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center mt-3 text-red-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}








// // src/components/FileUpload.jsx
// import React, { useCallback, useState, useEffect } from "react";
// import { useDropzone } from "react-dropzone";
// import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// /**
//  * Props:
//  * - onFilesUploaded(files) -> optional
//  * - onProcessingStatusChange(status) -> optional ("idle"|"processing"|"completed")
//  * - onDataProcessed(data) -> optional
//  */
// export default function FileUpload({
//   onFilesUploaded = () => {},
//   onProcessingStatusChange = () => {},
//   onDataProcessed = () => {},
// }) {
//   const [files, setFiles] = useState([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processingProgress, setProcessingProgress] = useState(0);
//   const [error, setError] = useState(null);

//   const onDrop = useCallback(
//     (acceptedFiles) => {
//       const newFiles = [...files, ...acceptedFiles];
//       setFiles(newFiles);
//       onFilesUploaded(newFiles);
//       setError(null);
//     },
//     [files, onFilesUploaded]
//   );

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "application/pdf": [".pdf"],
//       "text/plain": [".txt"],
//       "text/csv": [".csv"],
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
//       "application/vnd.ms-excel": [".xls"],
//     },
//     maxSize: 10 * 1024 * 1024, // 10 MB
//   });

//   useEffect(() => {
//     // cleanup if you create object URLs later
//     return () => {};
//   }, []);

//   const removeFile = (index) => {
//     const newFiles = files.filter((_, i) => i !== index);
//     setFiles(newFiles);
//     onFilesUploaded(newFiles);
//   };

//   const processFiles = async () => {
//     if (files.length === 0) return;
//     setIsProcessing(true);
//     setError(null);
//     onProcessingStatusChange("processing");
//     setProcessingProgress(0);

//     // visual progress simulation
//     const progressInterval = setInterval(() => {
//       setProcessingProgress((p) => Math.min(90, p + 10));
//     }, 200);

//     try {
//       const formData = new FormData();
//       files.forEach((f) => formData.append("files", f));

//       // TODO: replace with your backend endpoint
//       const resp = await fetch("/api/process-files", {
//         method: "POST",
//         body: formData,
//       });

//       if (!resp.ok) {
//         throw new Error("Server returned an error while processing files");
//       }

//       const data = await resp.json();

//       clearInterval(progressInterval);
//       setProcessingProgress(100);

//       // small delay for UX
//       setTimeout(() => {
//         setIsProcessing(false);
//         setProcessingProgress(0);
//         onProcessingStatusChange("completed");
//         onDataProcessed(data);
//       }, 500);
//     } catch (err) {
//       clearInterval(progressInterval);
//       setError(err?.message || "Processing failed");
//       setIsProcessing(false);
//       setProcessingProgress(0);
//       onProcessingStatusChange("idle");
//     }
//   };

//   const getFileIcon = (file) => {
//     if (!file) return "📝";
//     if (file.type.includes("pdf")) return "📄";
//     if (file.name?.endsWith?.(".xlsx") || file.name?.endsWith?.(".xls")) return "📊";
//     if (file.type.includes("csv")) return "📈";
//     return "📝";
//   };

//   return (
//     <div className="space-y-6">
//       {/* Upload area */}
//       <div className="p-6 transition border-2 border-dashed rounded-lg hover:border-indigo-400">
//         <div
//           {...getRootProps()}
//           className={`text-center cursor-pointer ${isDragActive ? "text-indigo-600" : "text-gray-700"}`}
//         >
//           <input {...getInputProps()} />
//           <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
//             <Upload className={`h-8 w-8 ${isDragActive ? "text-indigo-600" : "text-gray-400"}`} />
//           </div>

//           {isDragActive ? (
//             <p className="text-lg font-medium text-indigo-600">Drop files here</p>
//           ) : (
//             <>
//               <p className="text-lg font-medium text-gray-900">Drag & drop files or click to browse</p>
//               <p className="mb-2 text-sm text-gray-500">Supports: PDF, TXT, CSV, XLSX (max 10MB)</p>
//               <button
//                 type="button"
//                 className="inline-flex items-center px-3 py-2 text-sm bg-white border rounded"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <FileText className="w-4 h-4 mr-2" /> Choose Files
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Uploaded list */}
//       {files.length > 0 && (
//         <div className="p-4 bg-white rounded-lg shadow">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="font-semibold">Uploaded Files ({files.length})</h3>
//             <div className="text-sm text-gray-500">Review before processing</div>
//           </div>

//           <div className="space-y-2">
//             {files.map((file, idx) => (
//               <div key={idx} className="flex items-center justify-between p-2 border rounded">
//                 <div className="flex items-center space-x-3">
//                   <div className="text-2xl">{getFileIcon(file)}</div>
//                   <div>
//                     <div className="font-medium">{file.name}</div>
//                     <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <div className="px-2 py-1 text-xs bg-gray-100 rounded">{file.type || "Unknown"}</div>
//                   <button onClick={() => removeFile(idx)} className="p-1 text-red-500 hover:text-red-700">
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Processing */}
//       {files.length > 0 && (
//         <div className="p-4 bg-white rounded-lg shadow">
//           {isProcessing ? (
//             <div className="text-center">
//               <Loader2 className="w-6 h-6 mx-auto text-indigo-600 animate-spin" />
//               <div className="mt-3">Processing files... </div>
//               <div className="w-full h-3 mt-3 bg-gray-200 rounded-full">
//                 <div
//                   className="h-3 transition-all bg-indigo-600 rounded-full"
//                   style={{ width: `${processingProgress}%` }}
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className="text-center">
//               <button
//                 onClick={processFiles}
//                 disabled={isProcessing}
//                 className="inline-flex items-center px-4 py-2 text-white bg-indigo-600 rounded"
//               >
//                 <CheckCircle className="w-4 h-4 mr-2" /> Process Files with AI
//               </button>
//               <div className="mt-2 text-sm text-gray-500">Start AI analysis to extract insights</div>
//             </div>
//           )}

//           {error && (
//             <div className="flex items-center mt-3 text-red-700">
//               <AlertCircle className="w-4 h-4 mr-2" />
//               {error}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
