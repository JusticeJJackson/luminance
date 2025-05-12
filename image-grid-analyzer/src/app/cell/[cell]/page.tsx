'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import HistogramChart from '../../../components/HistogramChart';
import { getCellBrightness, getCellHistogram } from '../../../lib/imageProcessor';

function getCellStats(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let total = 0, r = 0, g = 0, b = 0, min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
        const br = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        total += br;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        min = Math.min(min, br);
        max = Math.max(max, br);
    }
    const pixels = data.length / 4;
    return {
        avgBrightness: total / pixels,
        avgR: r / pixels,
        avgG: g / pixels,
        avgB: b / pixels,
        minBrightness: min,
        maxBrightness: max,
        pixels,
        imageData,
    };
}

export default function CellDetailPage() {
    const params = useParams();
    const search = useSearchParams();
    const router = useRouter();
    const [cellImgUrl, setCellImgUrl] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [hist, setHist] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const imgUrl = search.get('img') ? decodeURIComponent(search.get('img')!) : null;
    const rows = Number(search.get('rows'));
    const cols = Number(search.get('cols'));
    const labelColor = search.get('labelColor') || '#1d4ed8';
    const histColor = search.get('histColor') || '#1d4ed8';
    const cell = params.cell as string;
    const [row, col] = cell.split('-').map(Number);

    useEffect(() => {
        if (!imgUrl || isNaN(row) || isNaN(col) || !rows || !cols) return;
        setLoading(true);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = imgUrl;
        img.onload = () => {
            const cellW = Math.floor(img.width / cols);
            const cellH = Math.floor(img.height / rows);
            const x = col * cellW;
            const y = row * cellH;
            const w = col === cols - 1 ? img.width - x : cellW;
            const h = row === rows - 1 ? img.height - y : cellH;
            // Get stats
            const s = getCellStats(img, x, y, w, h);
            setStats(s);
            setHist(getCellHistogram(img, x, y, w, h, 32));
            // Get thumbnail
            if (s) {
                const thumbCanvas = document.createElement('canvas');
                thumbCanvas.width = 64;
                thumbCanvas.height = 64;
                const ctx = thumbCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, x, y, w, h, 0, 0, 64, 64);
                    setCellImgUrl(thumbCanvas.toDataURL());
                }
            }
            setLoading(false);
        };
    }, [imgUrl, row, col, rows, cols]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
            <button
                className="absolute top-4 left-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => router.back()}
            >
                ← Back
            </button>
            <div className="w-full max-w-3xl flex flex-col items-center gap-8">
                <h2 className="text-2xl font-bold text-white">Cell {String.fromCharCode(65 + row)}{col + 1} Details</h2>
                {loading ? (
                    <div className="text-white">Loading...</div>
                ) : (
                    <>
                        <div className="flex flex-row items-center gap-8 w-full justify-center">
                            {cellImgUrl && (
                                <img src={cellImgUrl} alt="Cell thumbnail" className="w-24 h-24 rounded border-2 border-white bg-black object-contain" />
                            )}
                            <div className="text-white text-lg space-y-1">
                                <div><span className="font-semibold">Brightness:</span> {stats ? stats.avgBrightness.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">R:</span> {stats ? stats.avgR.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">G:</span> {stats ? stats.avgG.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">B:</span> {stats ? stats.avgB.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">Min Brightness:</span> {stats ? stats.minBrightness.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">Max Brightness:</span> {stats ? stats.maxBrightness.toFixed(1) : '-'}</div>
                                <div><span className="font-semibold">Pixels:</span> {stats ? stats.pixels : '-'}</div>
                            </div>
                        </div>
                        <div className="w-full flex flex-col items-center mt-8">
                            <div className="relative w-full max-w-2xl h-72 bg-white rounded shadow flex items-end">
                                {/* Y axis label */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-gray-700 text-sm font-semibold select-none" style={{ left: -40 }}>Count</div>
                                {/* X axis label */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-700 text-sm font-semibold select-none">Brightness (0-255)</div>
                                <div className="w-full h-full flex items-end justify-center">
                                    <HistogramChart data={hist} color={histColor} width={700} height={250} opacity={0.8} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 