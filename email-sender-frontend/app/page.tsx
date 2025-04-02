"use client";
import { useState } from "react";
import { saveAs } from "file-saver";
import axios from "axios";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react";
import type { RowData } from "./types/row-data";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  const downloadTemplate = (type: "xlsx" | "csv") => {
    const templateData = [
      { name: "John Doe", email: "john@example.com", message: "Hello there" },
    ];

    if (type === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "contact_template.xlsx");
    } else {
      const csv = "name,email,message\nJohn Doe,john@example.com,Hello there";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "contact_template.csv");
    }

    setTemplateDownloaded(true);
  };

  const validateFile = (file: File): Promise<boolean> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: "binary" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<RowData>(sheet);

          if (!rows.length) return setError("File is empty"), resolve(false);

          const required = ["name", "email", "message"];
          const headers = Object.keys(rows[0]);
          const validHeaders = required.every((key) => headers.includes(key));

          if (!validHeaders)
            return (
              setError("Missing columns: name, email, message"), resolve(false)
            );

          const validRows = rows.every(
            (row) =>
              row.name?.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email || "") &&
              row.message?.trim()
          );

          if (!validRows)
            return (
              setError("Some rows have invalid or missing data"), resolve(false)
            );

          setError(null);
          resolve(true);
        } catch {
          setError("Could not read file");
          resolve(false);
        }
      };
      reader.readAsBinaryString(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first.");

    const isValid = await validateFile(file);
    if (!isValid) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/`,
        formData
      );
      alert("Upload successful!");
      setFile(null);
    } catch {
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
      <h1 className="text-2xl font-bold">Contact Data Upload</h1>

      <div className="w-full max-w-2xl space-y-6">
        {/* Step 1 - Download */}
        <Card>
          <CardHeader className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </div>
            <CardTitle>Download Template</CardTitle>
            {templateDownloaded && (
              <CheckCircle className="ml-auto text-green-500" size={20} />
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p>Get started by downloading a template</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => downloadTemplate("xlsx")}
              >
                <Download size={16} />
                Excel Template
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate("csv")}>
                <Download size={16} />
                CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 - Upload */}
        <Card className={!templateDownloaded ? "opacity-60" : ""}>
          <CardHeader className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </div>
            <CardTitle>Upload Your File</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center space-y-6"
            >
              <label className="w-full p-8 border border-dashed border-gray-300 rounded-lg text-center cursor-pointer relative bg-white">
                <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                <span className="text-sm text-gray-500">
                  {file ? file.name : "Click or drag file here"}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={!templateDownloaded}
                />
              </label>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={!templateDownloaded || !file}>
                <Upload size={16} />
                Upload File
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
