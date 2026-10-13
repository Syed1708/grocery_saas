/**
 * Pure SVG Code 128 Barcode Generator
 * Generates vector barcode lines suitable for high-res thermal and laser printing
 */
export function generateBarcodeSvg(code: string, height = 35): string {
  const patterns: Record<string, string> = {
    "0": "11011001100", "1": "11001101100", "2": "11001100110", "3": "10010011000",
    "4": "10010001100", "5": "10001001100", "6": "10011001000", "7": "10011000100",
    "8": "10001100100", "9": "11001001000", "A": "11010010000", "B": "11010000100",
    "C": "11000101000", "D": "11001010000", "E": "11001000010", "F": "11000010100",
    "G": "10001101000", "H": "10001100010", "I": "11011101110", "J": "11000111010",
    "-": "10110001110", " ": "10111100010",
  };

  const clean = code.toUpperCase().replace(/[^0-9A-Z\-]/g, "") || "000000";

  let binary = "11010010000"; // Start code
  for (let i = 0; i < clean.length; i++) {
    binary += patterns[clean[i]] || "10010011000";
  }
  binary += "1100011101011"; // Stop code

  const barWidth = 2;
  const totalWidth = binary.length * barWidth;

  let rects = "";
  for (let x = 0; x < binary.length; x++) {
    if (binary[x] === "1") {
      rects += `<rect x="${x * barWidth}" y="0" width="${barWidth}" height="${height}" fill="#000000"/>`;
    }
  }

  return `<svg viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}