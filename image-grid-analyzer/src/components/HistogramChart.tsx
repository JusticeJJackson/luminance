import React from 'react';

interface HistogramChartProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    opacity?: number;
}

const HistogramChart: React.FC<HistogramChartProps> = ({ data, color = '#1d4ed8', width = 60, height = 24, opacity = 0.7 }) => {
    const max = Math.max(...data, 1);
    const binWidth = width / data.length;
    return (
        <svg width={width} height={height} className="block">
            {data.map((v, i) => (
                <rect
                    key={i}
                    x={i * binWidth}
                    y={height - (v / max) * height}
                    width={binWidth - 1}
                    height={(v / max) * height}
                    fill={color}
                    opacity={opacity}
                />
            ))}
        </svg>
    );
};

export default HistogramChart; 