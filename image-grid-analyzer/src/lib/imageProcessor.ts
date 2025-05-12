export function getCellBrightness(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
): number {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        // Luminance formula: 0.299*R + 0.587*G + 0.114*B
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return total / (data.length / 4);
}

export function getCellHistogram(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    bins: number = 16
): number[] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Array(bins).fill(0);
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const hist = Array(bins).fill(0);
    for (let i = 0; i < data.length; i += 4) {
        const brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        const bin = Math.floor((brightness / 256) * bins);
        hist[Math.min(bin, bins - 1)]++;
    }
    return hist;
} 