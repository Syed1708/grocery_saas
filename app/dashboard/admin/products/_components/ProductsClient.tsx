"use client";
"use no memo";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Plus,
  Edit2,
  Trash2,
  Barcode,
  Sparkles,
  AlertTriangle,
  Package,
  Scale,
  Building2,
  Layers,
  Eye,
  Calendar,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import {
  ProductFilterBar,
  StockStatusFilter,
} from "@/components/common/data-table/ProductFilterBar";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ImageUpload from "@/components/common/ImageUpload";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { generateBarcodeSvg } from "@/lib/BarcodeHelper";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/actions/product-actions";
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "@/app/actions/brand-actions";
import {
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
} from "@/app/actions/section-actions";
import {
  createUnitAction,
  deleteUnitAction,
  seedDefaultUnitsAction,
} from "@/app/actions/unit-actions";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";
import Image from "next/image";

interface ExtraOption {
  id: string;
  name: string;
  code?: string | null;
  companyName?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  description?: string | null;
  status?: string;
  _count: { products: number };
}

export default function ProductsClient({
  data,
  categories,
  brands,
  sections,
  units,
  currencySymbol = "৳",
   shopName = "Grocery Store",
}: {
  data: IProduct[];
  categories: ICategoryOption[];
  brands: ExtraOption[];
  sections: ExtraOption[];
  units: IUnitOption[];
  currencySymbol?: string;
  shopName?: string;
}) {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "brands" | "sections" | "units">("products");

  // Product Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<IProduct | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [hasBulkPackaging, setHasBulkPackaging] = useState(false);

  // 👈 Barcode Sticker Sheet Print Modal State
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<IProduct | null>(null);
  const [stickerQuantity, setStickerQuantity] = useState<number>(24);

  // 👈 Brand Edit / Delete States
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ExtraOption | null>(null);
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<ExtraOption | null>(null);

  // 👈 Section Edit / Delete States
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ExtraOption | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<ExtraOption | null>(null);

  // Unit Deletion State
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<IUnitOption | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedSection("");
    setStockStatus("ALL");
  }

  const isFiltered = Boolean(
    searchQuery || selectedCategory || selectedBrand || selectedSection || stockStatus !== "ALL"
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesNameEn = item.nameEn?.toLowerCase().includes(query) || false;
        const matchesBarcode = item.barcode.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesNameEn && !matchesBarcode && !matchesSku) return false;
      }
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (selectedBrand && item.brandId !== selectedBrand) return false;
      if (selectedSection && item.sectionId !== selectedSection) return false;

      if (stockStatus === "IN_STOCK") {
        if (item.stockQuantity <= item.minStockAlert) return false;
      } else if (stockStatus === "LOW_STOCK") {
        if (item.stockQuantity > item.minStockAlert || item.stockQuantity <= 0) return false;
      } else if (stockStatus === "OUT_OF_STOCK") {
        if (item.stockQuantity > 0) return false;
      }
      return true;
    });
  }, [data, searchQuery, selectedCategory, selectedBrand, selectedSection, stockStatus]);

  function openCreateProduct() {
    setEditingProduct(null);
    setBarcodeInput("");
    setHasBulkPackaging(false);
    setProductModalOpen(true);
  }

  function openEditProduct(product: IProduct) {
    setEditingProduct(product);
    setBarcodeInput(product.barcode);
    setHasBulkPackaging(Boolean(product.bulkUnitName && Number(product.conversionFactor) > 1));
    setProductModalOpen(true);
  }

  function handleAutoBarcode() {
    const randomCode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBarcodeInput(randomCode);
    toast.info(`Generated Barcode: ${randomCode}`);
  }

  async function handleProductSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingProduct) {
      formData.append("id", editingProduct.id);
    }

    const res = editingProduct
      ? await updateProductAction(formData)
      : await createProductAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        editingProduct ? "Product updated successfully!" : "Product added to catalog successfully!"
      );
      setProductModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleDeleteProductConfirm() {
    if (!deleteProductTarget) return;
    setLoading(true);
    const res = await deleteProductAction(deleteProductTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`"${deleteProductTarget.name}" deleted successfully!`);
      setDeleteProductTarget(null);
    } else {
      toast.error(res.error || "Failed to delete product.");
    }
  }

  // 👈 Brand Handlers (Create & Update)
  function openEditBrand(brand: ExtraOption) {
    setEditingBrand(brand);
    setBrandModalOpen(true);
  }

  async function handleBrandSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingBrand) {
      formData.append("id", editingBrand.id);
    }

    const res = editingBrand
      ? await updateBrandAction(formData)
      : await createBrandAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingBrand ? "Brand updated successfully!" : "Brand created successfully!");
      setBrandModalOpen(false);
    } else {
      toast.error(res.error || "Failed to save brand.");
    }
  }

  async function handleDeleteBrandConfirm() {
    if (!deleteBrandTarget) return;
    setLoading(true);
    const res = await deleteBrandAction(deleteBrandTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`Brand "${deleteBrandTarget.name}" deleted.`);
      setDeleteBrandTarget(null);
    } else {
      toast.error(res.error || "Failed to delete brand.");
    }
  }

  // 👈 Section Handlers (Create & Update)
  function openEditSection(section: ExtraOption) {
    setEditingSection(section);
    setSectionModalOpen(true);
  }

  async function handleSectionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingSection) {
      formData.append("id", editingSection.id);
    }

    const res = editingSection
      ? await updateSectionAction(formData)
      : await createSectionAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingSection ? "Section updated successfully!" : "Section created successfully!");
      setSectionModalOpen(false);
    } else {
      toast.error(res.error || "Failed to save section.");
    }
  }

  async function handleDeleteSectionConfirm() {
    if (!deleteSectionTarget) return;
    setLoading(true);
    const res = await deleteSectionAction(deleteSectionTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`Section "${deleteSectionTarget.name}" deleted.`);
      setDeleteSectionTarget(null);
    } else {
      toast.error(res.error || "Failed to delete section.");
    }
  }

  // Unit Handlers
  async function handleCreateUnit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await createUnitAction(new FormData(form));
    setLoading(false);
    if (res.success) {
      toast.success("Measurement unit added successfully!");
      form.reset();
    } else {
      toast.error(res.error || "Failed to create unit.");
    }
  }

  async function handleDeleteUnitConfirm() {
    if (!deleteUnitTarget) return;
    setLoading(true);
    const res = await deleteUnitAction(deleteUnitTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`Unit "${deleteUnitTarget.name}" deleted.`);
      setDeleteUnitTarget(null);
    } else {
      toast.error(res.error || "Failed to delete unit.");
    }
  }

  async function handleLoadDefaultUnits() {
    setLoading(true);
    const res = await seedDefaultUnitsAction();
    setLoading(false);
    if (res.success) {
      toast.success("Loaded 10 standard grocery units successfully!");
    } else {
      toast.error(res.error || "Failed to load units.");
    }
  }

  // 👈 Print Helper: Prints only the sticker container
// 👈 Full A4 Multi-Page Barcode Sheet Print Engine
function triggerPrint() {
  if (!barcodePrintProduct) return;

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    toast.error("Please allow popups to print barcode sheets.");
    return;
  }

  const barcodeSvg = generateBarcodeSvg(barcodePrintProduct.barcode, 30);

  // Generate stickers based on chosen quantity
  const stickersHtml = Array.from({ length: stickerQuantity })
    .map(
      () => `
      <div class="sticker">
        <div class="store-name">${shopName}</div>
        <div class="product-name">${barcodePrintProduct.name}</div>
        <div class="barcode-svg">${barcodeSvg}</div>
        <div class="footer">
          <span class="barcode-num">${barcodePrintProduct.barcode}</span>
          <span class="price">${currencySymbol}${barcodePrintProduct.sellingPrice.toFixed(2)}</span>
        </div>
      </div>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Barcode Stickers - ${barcodePrintProduct.name}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 8mm; /* Standard sticker sheet margins */
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, -apple-system, sans-serif;
          background: #fff;
          color: #000;
          -webkit-print-color-adjust: exact;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 👈 3 stickers per row */
          gap: 3.5mm;
          width: 100%;
        }
        .sticker {
          border: 1px dashed #aaa;
          border-radius: 4px;
          padding: 5px 6px;
          text-align: center;
          height: 33mm; /* Standard sticker height */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          page-break-inside: avoid; /* 👈 Prevents sticker being split between pages */
          background: #fff;
        }
        .store-name {
          font-size: 8px;
          font-weight: bold;
          text-transform: uppercase;
          color: #444;
          letter-spacing: 0.5px;
        }
        .product-name {
          font-size: 10px;
          font-weight: 800;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
          color: #111;
          margin-top: 1px;
        }
        .barcode-svg {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 1px 0;
        }
        .barcode-svg svg {
          width: 90%;
          height: 26px;
        }
        .footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: monospace;
          border-top: 1px solid #ddd;
          padding-top: 2px;
        }
        .barcode-num {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .price {
          font-size: 11px;
          font-weight: 900;
        }
      </style>
    </head>
    <body>
      <div class="grid">
        ${stickersHtml}
      </div>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
  // Table Columns
  const columns: ColumnDef<IProduct>[] = [
    {
      accessorKey: "image",
      header: "Photo",
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            {image ? (
              <Image
                src={image}
                alt={row.getValue("name") as string}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm">📦</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Product & Location",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
              {row.getValue("name")}
            </span>
            {row.original.status === "inactive" && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-neutral-100 text-neutral-500">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
            <span>{row.original.categoryName}</span>
            {row.original.brandName && (
              <>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">{row.original.brandName}</span>
              </>
            )}
            {row.original.sectionName && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">[{row.original.sectionName}]</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "barcode",
      header: "Barcode",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
          <Barcode size={12} /> {row.getValue("barcode")}
        </span>
      ),
    },
    {
      accessorKey: "costPrice",
      header: "Cost",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 text-xs">
          {currencySymbol}{Number(row.getValue("costPrice")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "sellingPrice",
      header: "Retail Price",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs block">
            {currencySymbol}{Number(row.getValue("sellingPrice")).toFixed(2)}
          </span>
          {Number(row.original.vatPercent || 0) > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
              + {row.original.vatPercent}% VAT
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stockQuantity",
      header: "Current Stock",
      cell: ({ row }) => {
        const stock = Number(row.original.stockQuantity);
        const minAlert = Number(row.original.minStockAlert);
        const isLow = stock <= minAlert;
        const isOut = stock <= 0;

        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md inline-flex items-center gap-1 w-fit ${
                isOut
                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                  : isLow
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {(isLow || isOut) && <AlertTriangle size={12} />}
              {stock} {row.original.unitCode}
            </span>
            {(row.original.conversionFactor ?? 0) > 1 && (
              <span className="text-[10px] text-neutral-400">
                (1 {row.original.bulkUnitName || "Bulk"} = {row.original.conversionFactor} {row.original.unitCode})
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1">
            {/* 👈 1. Barcode Print Button */}
            <button
              onClick={() => setBarcodePrintProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Print Barcode Stickers"
            >
              <Printer size={15} />
            </button>

            {/* 2. View Details Button */}
            <button
              onClick={() => setViewProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="View Full Details"
            >
              <Eye size={15} />
            </button>

            {/* 3. Edit Button */}
            <button
              onClick={() => openEditProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Product"
            >
              <Edit2 size={15} />
            </button>

            {/* 4. Delete Button */}
            <button
              onClick={() => setDeleteProductTarget(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete Product"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Products & Catalog" }]} />

      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "products"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Package size={14} /> Products Catalog ({data.length})
          </button>
          
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "categories"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Package size={14} /> Categories ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab("brands")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "brands"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Building2 size={14} /> Brands / Co. ({brands.length})
          </button>

          <button
            onClick={() => setActiveTab("sections")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "sections"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Layers size={14} /> Shelves &amp; Racks / তাক ({sections.length})
          </button>

          <button
            onClick={() => setActiveTab("units")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "units"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Scale size={14} /> Units ({units.length})
          </button>
        </div>

        {activeTab === "products" && (
          <div className="flex items-center gap-2 shrink-0">
            <DataTableViewOptions table={table} />
            <button
              onClick={openCreateProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            stockStatus={stockStatus}
            onStockStatusChange={setStockStatus}
            categories={categories}
            brands={brands}
            sections={sections}
            onReset={handleResetFilters}
            isFiltered={isFiltered}
          />
          <DataTable table={table} columns={columns} />
        </div>
      )}

      {/* TAB 2: BRANDS (With Working Edit & Delete!) */}
      {activeTab === "brands" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Brands &amp; Distributor Companies
              </h2>
              <p className="text-xs text-neutral-500">Manage manufacturers, brand identities, and distributor SRs</p>
            </div>
            <button
              onClick={() => { setEditingBrand(null); setBrandModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus size={15} /> Add Brand
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              All Brands ({brands.length})
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {brands.map((b) => (
                <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{b.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${b.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-neutral-100 text-neutral-500"}`}>
                        {b.status || "active"}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Distributor: <strong>{b.companyName || "—"}</strong> • SR: <strong>{b.contactPerson || "None"}</strong> ({b.phone || "No Phone"}) • {b._count.products} products
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* 👈 Working Edit Brand Button */}
                    <button
                      onClick={() => openEditBrand(b)}
                      className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* 👈 Working Delete Brand Button */}
                    <button
                      onClick={() => setDeleteBrandTarget(b)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS / তাক (With Working Edit & Delete!) */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Shelves &amp; Racks (দোকানের তাক ও সেকশন)
              </h2>
              <p className="text-xs text-neutral-500">Track shelf numbers and storage areas for fast product locating</p>
            </div>
            <button
              onClick={() => { setEditingSection(null); setSectionModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus size={15} /> Add Shelf Section
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              All Shelves ({sections.length})
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sections.map((s) => (
                <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</span>
                      <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded font-bold">
                        {s.code || "No Code"}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {s.description || "No Description"} • {s._count.products} products assigned to this shelf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* 👈 Working Edit Section Button */}
                    <button
                      onClick={() => openEditSection(s)}
                      className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="Edit Shelf"
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* 👈 Working Delete Section Button */}
                    <button
                      onClick={() => setDeleteSectionTarget(s)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="Delete Shelf"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNITS */}
      {activeTab === "units" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Add Measurement Unit
            </h2>
            <form onSubmit={handleCreateUnit} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Unit Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Carton, Sachet, Tin"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Symbol / Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g. ctn, sch, tin"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                Create Unit
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
              <span className="font-bold">Active Units in Store ({units.length})</span>
              <button
                type="button"
                onClick={handleLoadDefaultUnits}
                disabled={loading}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                + Reload 10 Standard Units
              </button>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {units.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div className="flex items-center gap-3">
                    <Scale size={16} className="text-neutral-400" />
                    <div>
                      <span className="font-semibold block">{u.name}</span>
                      <span className="text-[10px] text-neutral-400">{u._count?.products || 0} products</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      {u.code}
                    </span>
                    <button
                      onClick={() => setDeleteUnitTarget(u)}
                      disabled={(u._count?.products || 0) > 0}
                      className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 👈 BARCODE MULTIPLE STICKERS PRINT MODAL                 */}
      {/* ========================================================= */}
      {barcodePrintProduct && (
        <Modal
          isOpen={Boolean(barcodePrintProduct)}
          onClose={() => setBarcodePrintProduct(null)}
          title="Print Product Barcode Stickers"
          description={`Print multiple barcode stickers for ${barcodePrintProduct.name}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Controls Bar (Excluded from printing) */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Sticker Quantity:
                </span>
                {[12, 24, 30, 48].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setStickerQuantity(qty)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                      stickerQuantity === qty
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {qty}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={stickerQuantity}
                  onChange={(e) => setStickerQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold text-center"
                />
              </div>

              <button
                type="button"
                onClick={triggerPrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Printer size={15} /> Print Labels Now
              </button>
            </div>

            {/* 👈 Printable Stickers Sheet Grid */}
            <div
              id="printable-barcode-sheet"
              className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto p-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950"
            >
              {Array.from({ length: stickerQuantity }).map((_, index) => (
                <div
                  key={index}
                  className="p-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-between text-center bg-white text-black min-h-27.5"
                >
                  <span className="text-[10px] font-bold truncate max-w-42.5 uppercase text-neutral-800">
                    {barcodePrintProduct.name}
                  </span>

                  {/* Rendered SVG Barcode */}
                  <div
                    className="w-full my-1 flex justify-center"
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSvg(barcodePrintProduct.barcode, 32),
                    }}
                  />

                  <div className="w-full flex justify-between items-center text-[10px] font-mono px-1">
                    <span className="font-semibold">{barcodePrintProduct.barcode}</span>
                    <span className="font-black text-[11px]">
                      {currencySymbol}{barcodePrintProduct.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Print CSS rule */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-barcode-sheet,
                #printable-barcode-sheet * {
                  visibility: visible;
                }
                #printable-barcode-sheet {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  display: grid;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 8px !important;
                  border: none !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            <div className="flex justify-end pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setBarcodePrintProduct(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRODUCT FORM MODAL */}
      <FormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        title={editingProduct ? "Edit Product" : "New Grocery Product"}
        description="Configure product details, shelf placement, barcode, pricing, expiry date, and status."
        isEditing={Boolean(editingProduct)}
        loading={loading}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Product Name (Bangla / Primary) *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingProduct?.name || ""}
              placeholder="e.g. চিনি ১ কেজি, মিনিকেট চাল"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Name in English (Optional)
            </label>
            <input
              type="text"
              name="nameEn"
              defaultValue={editingProduct?.nameEn || ""}
              placeholder="e.g. Sugar 1kg, Miniket Rice"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Category *
            </label>
            <select
              name="categoryId"
              required
              defaultValue={editingProduct?.categoryId || ""}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled>Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Brand / Company
            </label>
            <select
              name="brandId"
              defaultValue={editingProduct?.brandId || ""}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">None / Unbranded</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Shelf / তাক
            </label>
            <select
              name="sectionId"
              defaultValue={editingProduct?.sectionId || ""}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">None / Storage</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Barcode / SKU
            </label>
            <button
              type="button"
              onClick={handleAutoBarcode}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
            >
              <Sparkles size={12} /> Auto-Generate Barcode
            </button>
          </div>
          <div className="relative">
            <Barcode className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              type="text"
              name="barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan with barcode gun or click auto-generate"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Cost Price ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              name="costPrice"
              defaultValue={editingProduct?.costPrice ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Retail Price ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              name="sellingPrice"
              required
              defaultValue={editingProduct?.sellingPrice ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Wholesale Price
            </label>
            <input
              type="number"
              step="0.01"
              name="wholesalePrice"
              defaultValue={editingProduct?.wholesalePrice ?? ""}
              placeholder="Optional"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              VAT / Tax (%)
            </label>
            <input
              type="number"
              step="0.01"
              name="vatPercent"
              defaultValue={editingProduct?.vatPercent ?? 0}
              placeholder="0%"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Measurement Unit *
            </label>
            <select
              name="unitId"
              required
              defaultValue={editingProduct?.unitId || units[0]?.id || ""}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              name="expiryDate"
              defaultValue={editingProduct?.expiryDate || ""}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Status *
            </label>
            <select
              name="status"
              defaultValue={editingProduct?.status || "active"}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="active">Active (Available for POS)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Opening Stock Quantity
            </label>
            <input
              type="number"
              step="0.01"
              name="stockQuantity"
              defaultValue={editingProduct?.stockQuantity ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Low-Stock Alert Level
            </label>
            <input
              type="number"
              step="0.01"
              name="minStockAlert"
              defaultValue={editingProduct?.minStockAlert ?? 5}
              placeholder="5"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasBulkPackaging}
              onChange={(e) => setHasBulkPackaging(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Does this item come in a bulk box or carton? (Optional)
            </span>
          </label>

          {hasBulkPackaging && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Bulk Container Name
                </label>
                <input
                  type="text"
                  name="bulkUnitName"
                  defaultValue={editingProduct?.bulkUnitName || "Carton"}
                  placeholder="e.g. Carton, Box, Sack"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  How many units inside?
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="conversionFactor"
                  defaultValue={editingProduct?.conversionFactor ?? 24}
                  placeholder="e.g. 24"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Description / Shelf Notes (Optional)
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editingProduct?.description || ""}
            placeholder="Special storage instructions or shelf notes..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <ImageUpload
          name="image"
          defaultImage={editingProduct?.image}
          label="Product Photo"
        />
      </FormModal>

      {/* 👈 EDIT BRAND MODAL */}
      <FormModal
        isOpen={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSubmit={handleBrandSubmit}
        title={editingBrand ? "Edit Brand Profile" : "Add Brand"}
        description="Update manufacturer, distributor company, and SR contact details."
        isEditing={Boolean(editingBrand)}
        loading={loading}
      >
        <div>
          <label className="block text-xs font-medium mb-1">Brand Name *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={editingBrand?.name || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Company / Distributor</label>
          <input
            type="text"
            name="companyName"
            defaultValue={editingBrand?.companyName || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Distributor SR / Contact Person</label>
          <input
            type="text"
            name="contactPerson"
            defaultValue={editingBrand?.contactPerson || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">SR Phone Number</label>
          <input
            type="text"
            name="phone"
            defaultValue={editingBrand?.phone || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={editingBrand?.status || "active"}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </FormModal>

      {/* 👈 EDIT SECTION MODAL */}
      <FormModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        onSubmit={handleSectionSubmit}
        title={editingSection ? "Edit Shelf Section" : "Add Shelf"}
        description="Update shelf identifier and location details."
        isEditing={Boolean(editingSection)}
        loading={loading}
      >
        <div>
          <label className="block text-xs font-medium mb-1">Shelf Section Name *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={editingSection?.name || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Shelf Code</label>
          <input
            type="text"
            name="code"
            defaultValue={editingSection?.code || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Description / Location</label>
          <input
            type="text"
            name="description"
            defaultValue={editingSection?.description || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={editingSection?.status || "active"}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </FormModal>

      {/* VIEW PRODUCT SPECIFICATIONS MODAL */}
      {viewProduct && (
        <Modal
          isOpen={Boolean(viewProduct)}
          onClose={() => setViewProduct(null)}
          title="Product Specifications & Details"
          description={`Full audit specification for ${viewProduct.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                {viewProduct.image ? (
                  <Image
                    src={viewProduct.image}
                    alt={viewProduct.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {viewProduct.name}
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      viewProduct.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {viewProduct.status}
                  </span>
                </div>
                {viewProduct.nameEn && (
                  <p className="text-xs text-neutral-400">{viewProduct.nameEn}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>Category: <strong>{viewProduct.categoryName}</strong></span>
                  <span>•</span>
                  <span>Brand: <strong>{viewProduct.brandName || "Unbranded"}</strong></span>
                  <span>•</span>
                  <span>Shelf: <strong>{viewProduct.sectionName || "General Storage"}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Barcode</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{viewProduct.barcode}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">SKU Code</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{viewProduct.sku}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">Cost</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {currencySymbol}{viewProduct.costPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">Retail</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {currencySymbol}{viewProduct.sellingPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">Wholesale</span>
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {viewProduct.wholesalePrice ? `${currencySymbol}${viewProduct.wholesalePrice.toFixed(2)}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">Margin</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {viewProduct.sellingPrice > 0
                    ? `${(((viewProduct.sellingPrice - viewProduct.costPrice) / viewProduct.sellingPrice) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Branch Stock</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {viewProduct.stockQuantity} {viewProduct.unitCode}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Alert Level</span>
                <span className="text-amber-600 font-bold">{viewProduct.minStockAlert} {viewProduct.unitCode}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Expiry Date</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Calendar size={12} className="text-neutral-400" />
                  {viewProduct.expiryDate || "Not Set"}
                </span>
              </div>
            </div>

            {(viewProduct.conversionFactor ?? 0) > 1 && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                <strong>Packaging Conversion:</strong> 1 {viewProduct.bulkUnitName || "Bulk Container"} = {viewProduct.conversionFactor} {viewProduct.unitName} ({viewProduct.unitCode})
              </div>
            )}

            {viewProduct.description && (
              <div>
                <span className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">Description</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
                  {viewProduct.description}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-semibold rounded-xl text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProductConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProductTarget?.name}"?`}
        confirmLabel="Delete Product"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteBrandTarget)}
        onClose={() => setDeleteBrandTarget(null)}
        onConfirm={handleDeleteBrandConfirm}
        title="Delete Brand"
        message={`Are you sure you want to delete brand "${deleteBrandTarget?.name}"?`}
        confirmLabel="Delete Brand"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteSectionTarget)}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={handleDeleteSectionConfirm}
        title="Delete Shelf / Section"
        message={`Are you sure you want to delete section "${deleteSectionTarget?.name}"?`}
        confirmLabel="Delete Section"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteUnitTarget)}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnitConfirm}
        title="Delete Unit"
        message={`Are you sure you want to delete unit "${deleteUnitTarget?.name}"?`}
        confirmLabel="Delete Unit"
        loading={loading}
      />
    </div>
  );
}