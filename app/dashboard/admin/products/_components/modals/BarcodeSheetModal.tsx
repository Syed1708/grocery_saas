"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import { Printer } from "lucide-react";
import { IProduct } from "@/types";

interface Props {
  product: IProduct | null;
  onClose: () => void;
  shopName: string;
  branchName?: string;
  currencySymbol?: string;
}

function generateBarcodeSvg(text: string, height = 28): string {
  const cleanText = `*${(text || "123456").toUpperCase()}*`;
  
  const code39Map: Record<string, string> = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100'
  };

  let paths = "";
  let xCoord = 10;
  const narrowWidth = 1.5;
  const wideWidth = 3.8;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const pattern = code39Map[char] || code39Map['0'];

    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const w = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        paths += `<rect x="${xCoord}" y="0" width="${w}" height="${height}" fill="black" />`;
      }
      xCoord += w;
    }
    xCoord += narrowWidth;
  }

  const totalWidth = xCoord + 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}"><g>${paths}</g></svg>`;
}

export default function BarcodeSheetModal({
  product,
  onClose,
  shopName,
  branchName = "Main Branch",
  currencySymbol = "৳",
}: Props) {
  const [stickerQuantity, setStickerQuantity] = useState<number>(24);

  if (!product) return null;

  const barcodeSvgString = generateBarcodeSvg(product.barcode, 28);

  return (
    <>
      {/* 👈 Strict Print CSS with max-height removed for printing all rows */}
{/* 👈 FIX: Changed position absolute to static for multi-page A4 pagination */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 2mm 2mm !important;
              }
              body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
              body * { visibility: hidden !important; }
              #printable-barcode-sheet, #printable-barcode-sheet * { visibility: visible !important; }
              #printable-barcode-sheet {
                position: static !important;
                width: 100% !important;
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 3mm !important;
                background: white !important;
                max-height: none !important;
                overflow: visible !important;
              }
              .barcode-sticker-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      {/* Screen Modal (Hidden in Print) */}
      <Modal
        isOpen={Boolean(product)}
        onClose={onClose}
        title="বারকোড স্টিকার প্রিন্ট করুন (A4 Sticker Sheet)"
        description={`পণ্য: ${product.name} • শাখা: ${branchName} • প্রতি পাতায় ২৪-৪৮ টি স্টিকার`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                স্টিকার সংখ্যা:
              </span>
              {[12, 24, 30, 48].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setStickerQuantity(qty)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer transition ${
                    stickerQuantity === qty ? "bg-blue-600 text-white" : "border bg-white dark:bg-neutral-900"
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer size={15} /> প্রিন্ট করুন (Print Labels)
            </button>
          </div>

          {/* Sticker Grid Container */}
          <div
            id="printable-barcode-sheet"
            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto p-2 border rounded-xl bg-white text-black"
          >
            {Array.from({ length: stickerQuantity }).map((_, idx) => (
              <div
                key={idx}
                className="barcode-sticker-card p-2 border border-dashed border-neutral-300 rounded-lg flex flex-col justify-between items-center text-center bg-white text-black h-[33mm]"
              >
                <span className="text-[7.5px] font-bold truncate max-w-full uppercase text-neutral-600">
                  {shopName} • {branchName}
                </span>

                <span className="text-[10px] font-extrabold truncate max-w-full uppercase text-neutral-900">
                  {product.name}
                </span>

                <div
                  className="w-full my-0.5 flex justify-center items-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgString }}
                />

                <div className="w-full flex justify-between items-center text-[9px] font-mono px-0.5 border-t border-neutral-200 pt-0.5">
                  <span className="font-semibold">{product.barcode}</span>
                  <span className="font-black text-[10px]">
                    {currencySymbol}{Number(product.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer bg-neutral-100 dark:bg-neutral-800"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}