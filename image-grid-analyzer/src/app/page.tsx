'use client';
import React, { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import GridOverlay from "../components/GridOverlay";
import CellInspector from "../components/CellInspector";
import ExportPanel from "../components/ExportPanel";
import { useRouter } from 'next/navigation';

const MAX_GRID_SIZE = 26;
const gridOptions = Array.from({ length: MAX_GRID_SIZE }, (_, i) => i + 1);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gridRows, setGridRows] = useState<number>(5);
  const [gridCols, setGridCols] = useState<number>(5);
  const [labelColor, setLabelColor] = useState<string>("#1d4ed8");
  const [histColor, setHistColor] = useState<string>("#1d4ed8");
  const router = useRouter();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null); // PDF/TIFF preview not implemented yet
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!previewUrl) return;
    const params = new URLSearchParams({
      img: encodeURIComponent(previewUrl),
      rows: gridRows.toString(),
      cols: gridCols.toString(),
      labelColor,
      histColor,
      cell: `${row}-${col}`
    });
    router.push(`/cell/${row}-${col}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2 text-blue-700">Image Grid Analyzer</h1>
      <p className="mb-8 text-gray-600 text-center max-w-xl">
        Upload an image (JPG, PNG, PDF, or TIFF), overlay a labeled grid, and interact with each cell to analyze brightness and histogram data.
      </p>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <ImageUploader onFileSelect={handleFileSelect} />
          <ExportPanel />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center justify-center flex-wrap">
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Rows
              <select
                value={gridRows}
                onChange={e => setGridRows(Number(e.target.value))}
                className="mt-1 w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {gridOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Columns
              <select
                value={gridCols}
                onChange={e => setGridCols(Number(e.target.value))}
                className="mt-1 w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {gridOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Label Color
              <input
                type="color"
                value={labelColor}
                onChange={e => setLabelColor(e.target.value)}
                className="mt-1 w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                aria-label="Grid label color picker"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Histogram Color
              <input
                type="color"
                value={histColor}
                onChange={e => setHistColor(e.target.value)}
                className="mt-1 w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
                aria-label="Histogram color picker"
              />
            </label>
          </div>
          <GridOverlay
            imageUrl={previewUrl}
            gridRows={gridRows}
            gridCols={gridCols}
            labelColor={labelColor}
            histColor={histColor}
            onCellClick={handleCellClick}
          />
          <CellInspector />
        </div>
      </div>
    </div>
  );
}
