import React, { useEffect, useRef, useState } from 'react';
import { getCellBrightness, getCellHistogram } from '../lib/imageProcessor';
import HistogramChart from './HistogramChart';

interface GridOverlayProps {
    imageUrl: string | null;
    gridRows: number;
    gridCols: number;
    labelColor?: string;
    histColor?: string;
    onCellClick?: (row: number, col: number) => void;
}

const getCellLabels = (rows: number, cols: number) =>
    Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) =>
            String.fromCharCode(65 + row) + (col + 1)
        )
    );

const getFontScale = (rows: number, cols: number) => {
    const max = Math.max(rows, cols);
    if (max <= 10) return 1;
    // Scale down to 0.5 at 26
    return Math.max(0.5, 1 - (max - 10) * 0.03125); // 0.5 at 26
};

const HIST_BINS = 16;

const GridOverlay: React.FC<GridOverlayProps> = ({ imageUrl, gridRows, gridCols, labelColor, histColor, onCellClick }) => {
    const cellLabels = getCellLabels(gridRows, gridCols);
    const textColor = labelColor || '#1d4ed8'; // Tailwind blue-700
    const histogramColor = histColor || '#1d4ed8';
    const [brightnessGrid, setBrightnessGrid] = useState<number[][]>([]);
    const [histogramGrid, setHistogramGrid] = useState<number[][][]>([]);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const fontScale = getFontScale(gridRows, gridCols);
    const baseFontSize = 16; // px
    const basePadY = 0.25; // rem
    const basePadX = 0.5; // rem
    const [cellSize, setCellSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const gridRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setBrightnessGrid([]);
            setHistogramGrid([]);
            return;
        }
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
            const { width, height } = img;
            const cellW = Math.floor(width / gridCols);
            const cellH = Math.floor(height / gridRows);
            const grid: number[][] = [];
            const histGrid: number[][][] = [];
            for (let row = 0; row < gridRows; row++) {
                const rowArr: number[] = [];
                const histRow: number[][] = [];
                for (let col = 0; col < gridCols; col++) {
                    const x = col * cellW;
                    const y = row * cellH;
                    // Last cell in row/col may need to extend to edge
                    const w = col === gridCols - 1 ? width - x : cellW;
                    const h = row === gridRows - 1 ? height - y : cellH;
                    rowArr.push(Math.round(getCellBrightness(img, x, y, w, h)));
                    histRow.push(getCellHistogram(img, x, y, w, h, HIST_BINS));
                }
                grid.push(rowArr);
                histGrid.push(histRow);
            }
            setBrightnessGrid(grid);
            setHistogramGrid(histGrid);
        };
    }, [imageUrl, gridRows, gridCols]);

    useEffect(() => {
        if (!gridRef.current) return;
        const gridEl = gridRef.current;
        const resize = () => {
            const { width, height } = gridEl.getBoundingClientRect();
            setCellSize({ width: width / gridCols, height: height / gridRows });
        };
        resize();
        const observer = new (window as any).ResizeObserver(resize);
        observer.observe(gridEl);
        window.addEventListener('resize', resize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [gridRows, gridCols, imageUrl]);

    return (
        <div className="relative w-full max-w-4xl mx-auto bg-gray-100 border rounded-lg overflow-hidden">
            {imageUrl ? (
                <div className="w-full h-auto">
                    <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Grid"
                        className="w-full h-auto object-contain block"
                        style={{ aspectRatio: 'auto' }}
                    />
                    <div
                        ref={gridRef}
                        className="absolute inset-0 top-0 left-0 w-full h-full"
                        style={{ display: 'grid', gridTemplateRows: `repeat(${gridRows}, 1fr)`, gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
                    >
                        {cellLabels.flat().map((label, idx) => {
                            const row = Math.floor(idx / gridCols);
                            const col = idx % gridCols;
                            const brightness = brightnessGrid[row]?.[col];
                            const hist = histogramGrid[row]?.[col] || [];
                            const histWidth = cellSize.width * 0.5;
                            const histHeight = cellSize.height * 0.5;
                            return (
                                <div
                                    key={label}
                                    className="border border-blue-400 bg-blue-100/10 cursor-pointer"
                                    style={{
                                        borderRight: (col + 1) % gridCols === 0 ? '2px solid #3b82f6' : undefined,
                                        borderBottom: row === gridRows - 1 ? '2px solid #3b82f6' : undefined,
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    onClick={() => onCellClick?.(row, col)}
                                >
                                    {/* Cell label: upper left */}
                                    <span
                                        className="rounded absolute"
                                        style={{
                                            top: 2,
                                            left: 2,
                                            background: 'rgba(255,255,255,0.8)',
                                            color: textColor,
                                            zIndex: 2,
                                            fontSize: `${baseFontSize * fontScale}px`,
                                            padding: `${basePadY * fontScale}rem ${basePadX * fontScale}rem`,
                                            lineHeight: 1.1,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {label}
                                    </span>
                                    {/* Brightness: upper right */}
                                    {typeof brightness === 'number' && (
                                        <span
                                            className="font-bold absolute"
                                            style={{
                                                top: 2,
                                                right: 2,
                                                color: '#222',
                                                background: 'rgba(255,255,255,0.85)',
                                                borderRadius: '0.25rem',
                                                padding: `${basePadY * fontScale}rem ${basePadX * fontScale}rem`,
                                                fontSize: `${baseFontSize * fontScale}px`,
                                                zIndex: 2,
                                                lineHeight: 1.1,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            {brightness}
                                        </span>
                                    )}
                                    {/* Histogram: bottom center */}
                                    {hist.length > 0 && histWidth > 0 && histHeight > 0 && (
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2"
                                            style={{
                                                bottom: 2,
                                                zIndex: 2,
                                                width: `${histWidth}px`,
                                                height: `${histHeight}px`,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            <HistogramChart data={hist} color={histogramColor} width={histWidth} height={histHeight} opacity={0.6} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">No image loaded</div>
            )}
        </div>
    );
};

export default GridOverlay; 