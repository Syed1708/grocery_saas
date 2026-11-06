"use client";
"use no memo";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Package,
  Building2,
  Layers,
  Scale,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Printer,
  Barcode,
  AlertTriangle,
  Sparkles,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProductFilterBar, { StockStatusFilter } from "./ProductFilterBar";
import ImageUpload from "@/components/common/ImageUpload";

// Actions
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
import BarcodeSheetModal from "./modals/BarcodeSheetModal";

export interface ExtraOption {
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

interface ProductsClientProps {
  data: IProduct[];
  categories: ICategoryOption[];
  brands: ExtraOption[];
  sections: ExtraOption[];
  units: IUnitOption[];
  currencySymbol?: string;
  shopName?: string;
  userRole?: string;
  initialSearch?: string;
  autoViewBarcode?: string;
}

export default function ProductsClient({
  data = [],
  categories = [],
  brands = [],
  sections = [],
  units = [],
  currencySymbol = "৳",
  shopName = "Grocery Store",
  userRole = "OWNER",
  initialSearch = "",
  autoViewBarcode = "",
}: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "brands" | "sections" | "units"
  >("products");

  // Product Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<IProduct | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [hasBulkPackaging, setHasBulkPackaging] = useState(false);

  // Barcode Sticker Sheet Modal
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<IProduct | null>(null);
  const [stickerQuantity, setStickerQuantity] = useState<number>(24);

  // Brand Modals
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ExtraOption | null>(null);
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<ExtraOption | null>(null);

  // Section Modals
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ExtraOption | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<ExtraOption | null>(null);

  // Unit Deletion State
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<IUnitOption | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  const canViewCost = userRole === "OWNER" || userRole === "MANAGER";

  // 👈 AUTO-OPEN SPEC MODAL: Triggered when navigating from Stock Report ("পণ্যের বিবরণ দেখুন")
  useEffect(() => {
    if (autoViewBarcode && data.length > 0) {
      const match = data.find(
        (p) => p.barcode === autoViewBarcode || p.sku === autoViewBarcode
      );
      if (match) {
        setViewProduct(match);
      }
    }
  }, [autoViewBarcode, data]);

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

  // Filter Engine
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(query) || false;
        const matchesNameEn = item.nameEn?.toLowerCase().includes(query) || false;
        const matchesBarcode = item.barcode?.toLowerCase().includes(query) || false;
        const matchesSku = item.sku?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesNameEn && !matchesBarcode && !matchesSku) return false;
      }
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (selectedBrand && item.brandId !== selectedBrand) return false;
      if (selectedSection && item.sectionId !== selectedSection) return false;

      const stock = Number(item.stockQuantity || 0);
      const alert = Number(item.minStockAlert || 5);

      if (stockStatus === "IN_STOCK") {
        if (stock <= alert) return false;
      } else if (stockStatus === "LOW_STOCK") {
        if (stock > alert || stock <= 0) return false;
      } else if (stockStatus === "OUT_OF_STOCK") {
        if (stock > 0) return false;
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
    toast.info(`জেনারেট করা বারকোড: ${randomCode}`);
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
        editingProduct ? "পণ্য তথ্য সফলভাবে আপডেট হয়েছে!" : "নতুন পণ্য ক্যাটালগে যুক্ত হয়েছে!"
      );
      setProductModalOpen(false);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  async function handleDeleteProductConfirm() {
    if (!deleteProductTarget) return;
    setLoading(true);
    const res = await deleteProductAction(deleteProductTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`"${deleteProductTarget.name}" মুছে ফেলা হয়েছে!`);
      setDeleteProductTarget(null);
    } else {
      toast.error(res.error || "পণ্য মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  function openEditBrand(brand: ExtraOption) {
    setEditingBrand(brand);
    setBrandModalOpen(true);
  }

  async function handleBrandSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingBrand) formData.append("id", editingBrand.id);

    const res = editingBrand ? await updateBrandAction(formData) : await createBrandAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success(editingBrand ? "ব্র্যান্ড আপডেট হয়েছে!" : "নতুন ব্র্যান্ড তৈরি হয়েছে!");
      setBrandModalOpen(false);
    } else {
      toast.error(res.error || "ব্র্যান্ড সংরক্ষণ করা সম্ভব হয়নি।");
    }
  }

  async function handleDeleteBrandConfirm() {
    if (!deleteBrandTarget) return;
    setLoading(true);
    const res = await deleteBrandAction(deleteBrandTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`ব্র্যান্ড "${deleteBrandTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteBrandTarget(null);
    } else {
      toast.error(res.error || "ব্র্যান্ড মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  function openEditSection(section: ExtraOption) {
    setEditingSection(section);
    setSectionModalOpen(true);
  }

  async function handleSectionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingSection) formData.append("id", editingSection.id);

    const res = editingSection ? await updateSectionAction(formData) : await createSectionAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success(editingSection ? "তাক বা সেকশন আপডেট হয়েছে!" : "নতুন তাক তৈরি হয়েছে!");
      setSectionModalOpen(false);
    } else {
      toast.error(res.error || "তাক সংরক্ষণ করা সম্ভব হয়নি।");
    }
  }

  async function handleDeleteSectionConfirm() {
    if (!deleteSectionTarget) return;
    setLoading(true);
    const res = await deleteSectionAction(deleteSectionTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`তাক "${deleteSectionTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteSectionTarget(null);
    } else {
      toast.error(res.error || "তাক মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  async function handleCreateUnit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await createUnitAction(new FormData(form));
    setLoading(false);
    if (res.success) {
      toast.success("পরিমাপ একক সফলভাবে তৈরি হয়েছে!");
      form.reset();
    } else {
      toast.error(res.error || "একক তৈরি ব্যর্থ হয়েছে।");
    }
  }

  async function handleDeleteUnitConfirm() {
    if (!deleteUnitTarget) return;
    setLoading(true);
    const res = await deleteUnitAction(deleteUnitTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`একক "${deleteUnitTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteUnitTarget(null);
    } else {
      toast.error(res.error || "একক মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  async function handleLoadDefaultUnits() {
    setLoading(true);
    const res = await seedDefaultUnitsAction();
    setLoading(false);
    if (res.success) {
      toast.success("১০টি প্রমিত মুদি একক সফলভাবে লোড হয়েছে!");
    } else {
      toast.error(res.error || "একক লোড ব্যর্থ হয়েছে।");
    }
  }

  // 👈 Native Popup-Free Barcode Sheet Print
  function triggerPrint() {
    window.print();
  }

  // Product Table Columns
  const columns: ColumnDef<IProduct>[] = [
    {
      accessorKey: "image",
      header: "ছবি",
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex items-center justify-center">
            {image ? (
              <Image src={image} alt={row.getValue("name") as string} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">📦</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "পণ্যের বিবরণ ও অবস্থান",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block text-xs">
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
                <span className="text-amber-600 font-medium">[{row.original.sectionName}]</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "barcode",
      header: "বারকোড",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md border">
          <Barcode size={12} /> {row.getValue("barcode")}
        </span>
      ),
    },
    // 🛡️ Role-Gated Purchase Cost
    ...(canViewCost
      ? [
        {
          accessorKey: "costPrice",
          header: "ক্রয় দর",
          cell: ({ row }: any) => (
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              {currencySymbol}{Number(row.getValue("costPrice")).toFixed(2)}
            </span>
          ),
        },
      ]
      : []),
    {
      accessorKey: "sellingPrice",
      header: "বিক্রয় দর (Retail)",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs font-mono block">
            {currencySymbol}{Number(row.getValue("sellingPrice")).toFixed(2)}
          </span>
          {Number(row.original.vatPercent || 0) > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
              + {row.original.vatPercent}% ভ্যাট
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stockQuantity",
      header: "বর্তমান স্টক",
      cell: ({ row }) => {
        const stock = Number(row.original.stockQuantity || 0);
        const minAlert = Number(row.original.minStockAlert || 5);
        const isLow = stock <= minAlert;
        const isOut = stock <= 0;

        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md inline-flex items-center gap-1 w-fit ${isOut
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  : isLow
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                }`}
            >
              {(isLow || isOut) && <AlertTriangle size={12} />}
              {stock} {row.original.unitCode}
            </span>
            {(row.original.conversionFactor ?? 0) > 1 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                (১ {row.original.bulkUnitName || "কার্টন"} = {row.original.conversionFactor} {row.original.unitCode})
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBarcodePrintProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="বারকোড স্টিকার প্রিন্ট"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="বিস্তারিত দেখুন"
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              onClick={() => openEditProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="পণ্য সম্পাদনা"
            >
              <Edit2 size={15} />
            </button>
            {userRole === "OWNER" && (
              <button
                type="button"
                onClick={() => setDeleteProductTarget(product)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 size={15} />
              </button>
            )}
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
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "পণ্য ও ক্যাটালগ (Products & Catalog)" }]} />

      {/* Top 5 Primary Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "products"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Package size={14} /> পণ্য তালিকা ({data.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "categories"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Package size={14} /> ক্যাটাগরি ({categories.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("brands")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "brands"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Building2 size={14} /> ব্র্যান্ড / কোম্পানি ({brands.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "sections"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Layers size={14} /> তাক ও র্যাক ({sections.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("units")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "units"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Scale size={14} /> পরিমাপ একক ({units.length})
          </button>
        </div>

        {activeTab === "products" && (
          <div className="flex items-center gap-2 shrink-0">
            <DataTableViewOptions table={table} />
            <button
              type="button"
              onClick={openCreateProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন পণ্য যোগ
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCTS CATALOG & ADVANCED FILTER BAR */}
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

      {/* TAB 2: BRANDS */}
      {activeTab === "brands" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                ব্র্যান্ড ও সরবরাহকারী কোম্পানি (Brands)
              </h2>
              <p className="text-xs text-neutral-500">উৎপাদক কোম্পানি ও পরিবেশক প্রতিনিধি (SR) তথ্য পরিচালনা করুন</p>
            </div>
            <button
              type="button"
              onClick={() => { setEditingBrand(null); setBrandModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus size={15} /> ব্র্যান্ড যোগ করুন
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              সকল ব্র্যান্ড ({brands.length})
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
                      কোম্পানি: <strong>{b.companyName || "—"}</strong> • SR: <strong>{b.contactPerson || "None"}</strong> ({b.phone || "No Phone"}) • {b._count.products} টি পণ্য নিবন্ধিত
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditBrand(b)}
                      className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit2 size={15} />
                    </button>
                    {userRole === "OWNER" && (
                      <button
                        type="button"
                        onClick={() => setDeleteBrandTarget(b)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS / তাক */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                দোকানের তাক ও র্যাক সেকশন (Shelves & Racks)
              </h2>
              <p className="text-xs text-neutral-500">দোকানের ডিসপ্লে তাক ও গোডাউনের লোকেশন ট্র্যাকিং</p>
            </div>
            <button
              type="button"
              onClick={() => { setEditingSection(null); setSectionModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus size={15} /> নতুন তাক যোগ
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              সকল তাক ({sections.length})
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
                      {s.description || "কোন বিবরণ নেই"} • {s._count.products} টি পণ্য এই তাকে রাখা আছে
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditSection(s)}
                      className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit2 size={15} />
                    </button>
                    {userRole === "OWNER" && (
                      <button
                        type="button"
                        onClick={() => setDeleteSectionTarget(s)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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
              পরিমাপ একক যোগ করুন (Measurement Units)
            </h2>
            <form onSubmit={handleCreateUnit} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  এককের নাম *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="যেমন: Carton, Packet, Liter, Dozen"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  প্রতীক বা কোড *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="যেমন: ctn, pkt, ltr, dzn"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                একক তৈরি করুন
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
              <span className="font-bold">দোকানের সক্রিয় পরিমাপ একক ({units.length})</span>
              <button
                type="button"
                onClick={handleLoadDefaultUnits}
                disabled={loading}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                + ১০টি প্রমিত মুদি একক রিলোড করুন
              </button>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {units.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div className="flex items-center gap-3">
                    <Scale size={16} className="text-neutral-400" />
                    <div>
                      <span className="font-semibold block">{u.name}</span>
                      <span className="text-[10px] text-neutral-400">{u._count?.products || 0} টি পণ্যে ব্যবহৃত</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      {u.code}
                    </span>
                    {userRole === "OWNER" && (
                      <button
                        type="button"
                        onClick={() => setDeleteUnitTarget(u)}
                        disabled={(u._count?.products || 0) > 0}
                        className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="একক মুছুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: A4 MULTIPLE STICKERS BARCODE PRINT MODAL */}
      {barcodePrintProduct && (
        <BarcodeSheetModal
          product={barcodePrintProduct}
          onClose={() => setBarcodePrintProduct(null)}
          shopName={shopName}
          branchName="Main Branch" // or dynamic active branch name
          currencySymbol={currencySymbol}
        />
      )}

      {/* MODAL 2: PRODUCT CREATE / EDIT MODAL */}
      <FormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        title={editingProduct ? "পণ্য তথ্য সম্পাদনা (Edit Product)" : "নতুন মুদি পণ্য যুক্ত করুন"}
        description="পণ্যের নাম, তাক নম্বর, বারকোড, ক্রয়মূল্য, বিক্রয়মূল্য ও মেয়াদ কনফিগার করুন।"
        isEditing={Boolean(editingProduct)}
        loading={loading}
        submitLabel={editingProduct ? "আপডেট করুন" : "যুক্ত করুন"}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                পণ্যের নাম (বাংলা) *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingProduct?.name || ""}
                placeholder="যেমন: চিনি ১ কেজি, মিনিকেট চাল"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ইংরেজি নাম (Name in English)
              </label>
              <input
                type="text"
                name="nameEn"
                defaultValue={editingProduct?.nameEn || ""}
                placeholder="e.g. Sugar 1kg, Miniket Rice"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ক্যাটাগরি *
              </label>
              <select
                name="categoryId"
                required
                defaultValue={editingProduct?.categoryId || ""}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="" disabled>ক্যাটাগরি সিলেক্ট করুন</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ব্র্যান্ড / কোম্পানি
              </label>
              <select
                name="brandId"
                defaultValue={editingProduct?.brandId || ""}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">কোনো ব্র্যান্ড নেই (Unbranded)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                তাক বা সেকশন
              </label>
              <select
                name="sectionId"
                defaultValue={editingProduct?.sectionId || ""}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">সাধারণ স্টোরেজ (General)</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                বারকোড (Barcode)
              </label>
              <button
                type="button"
                onClick={handleAutoBarcode}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                <Sparkles size={12} /> অটো বারকোড তৈরি
              </button>
            </div>
            <div className="relative">
              <Barcode className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input
                type="text"
                name="barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="বারকোড স্ক্যানার গান দিয়ে স্ক্যান করুন অথবা অটো জেনারেট বাটনে চাপুন"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ক্রয়মূল্য ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                name="costPrice"
                defaultValue={editingProduct?.costPrice ?? 0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                খুচরা দর ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                required
                defaultValue={editingProduct?.sellingPrice ?? 0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                পাইকারি দর
              </label>
              <input
                type="number"
                step="0.01"
                name="wholesalePrice"
                defaultValue={editingProduct?.wholesalePrice ?? ""}
                placeholder="ঐচ্ছিক"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ভ্যাট (% VAT)
              </label>
              <input
                type="number"
                step="0.01"
                name="vatPercent"
                defaultValue={editingProduct?.vatPercent ?? 0}
                placeholder="0%"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                পরিমাপ একক *
              </label>
              <select
                name="unitId"
                required
                defaultValue={editingProduct?.unitId || units[0]?.id || ""}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                মেয়াদোত্তীর্ণ তারিখ (ঐচ্ছিক)
              </label>
              <input
                type="date"
                name="expiryDate"
                defaultValue={editingProduct?.expiryDate || ""}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                অবস্থা *
              </label>
              <select
                name="status"
                defaultValue={editingProduct?.status || "active"}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="active">সক্রিয় (Active)</option>
                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                প্রারম্ভিক মজুদ পরিমাণ
              </label>
              <input
                type="number"
                step="0.01"
                name="stockQuantity"
                defaultValue={editingProduct?.stockQuantity ?? 0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                লো-স্টক সতর্কবার্তা সীমা
              </label>
              <input
                type="number"
                step="0.01"
                name="minStockAlert"
                defaultValue={editingProduct?.minStockAlert ?? 5}
                placeholder="5"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bulk Carton Conversion */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasBulkPackaging}
                onChange={(e) => setHasBulkPackaging(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                এই পণ্যটি কি কার্টন বা বক্সে আসে? (Bulk Package Conversion)
              </span>
            </label>

            {hasBulkPackaging && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    কার্টনের নাম
                  </label>
                  <input
                    type="text"
                    name="bulkUnitName"
                    defaultValue={editingProduct?.bulkUnitName || "Carton"}
                    placeholder="যেমন: Carton, Box, Sack"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    ভেতরে কত পিস থাকে? (Conversion Factor)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="conversionFactor"
                    defaultValue={editingProduct?.conversionFactor ?? 24}
                    placeholder="যেমন: 24"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              পণ্যের বিবরণ বা শেলফ নোট
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editingProduct?.description || ""}
              placeholder="স্টোরেজ নির্দেশিকা বা বিশেষ নোট..."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ImageUpload
            name="image"
            defaultImage={editingProduct?.image}
            label="পণ্যের ছবি আপলোড"
          />
        </div>
      </FormModal>

      {/* MODAL 3: BRAND MODAL */}
      <FormModal
        isOpen={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSubmit={handleBrandSubmit}
        title={editingBrand ? "ব্র্যান্ড তথ্য সম্পাদনা" : "নতুন ব্র্যান্ড যোগ"}
        description="উৎপাদক বা পরিবেশক কোম্পানির তথ্য যুক্ত করুন।"
        isEditing={Boolean(editingBrand)}
        loading={loading}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">ব্র্যান্ড নাম *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingBrand?.name || ""}
              placeholder="যেমন: Pran Foods"
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">কোম্পানি / পরিবেশক প্রতিষ্ঠান</label>
            <input
              type="text"
              name="companyName"
              defaultValue={editingBrand?.companyName || ""}
              placeholder="যেমন: প্রাণ-আরএফএল গ্রুপ"
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">বিক্রয় প্রতিনিধি (SR Name)</label>
            <input
              type="text"
              name="contactPerson"
              defaultValue={editingBrand?.contactPerson || ""}
              placeholder="যেমন: মোঃ রফিকুল ইসলাম"
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">SR মোবাইল নম্বর</label>
            <input
              type="text"
              name="phone"
              defaultValue={editingBrand?.phone || ""}
              placeholder="017xxxxxxxx"
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono dark:bg-neutral-800"
            />
          </div>
        </div>
      </FormModal>

      {/* MODAL 4: SECTION / SHELF MODAL */}
      <FormModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        onSubmit={handleSectionSubmit}
        title={editingSection ? "তাক বা সেকশন সম্পাদনা" : "নতুন তাক তৈরি"}
        description="দোকানের ডিসপ্লে তাক ও কোড কনফিগার করুন।"
        isEditing={Boolean(editingSection)}
        loading={loading}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">তাকের নাম *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingSection?.name || ""}
              placeholder="যেমন: তাক নং ০১ (সামনের ডিসপ্লে)"
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">তাক কোড (Shelf Code)</label>
            <input
              type="text"
              name="code"
              defaultValue={editingSection?.code || ""}
              placeholder="e.g. SH-01"
              className="w-full px-3 py-2 text-xs border rounded-xl font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">বিবরণ / অবস্থান</label>
            <input
              type="text"
              name="description"
              defaultValue={editingSection?.description || ""}
              placeholder="দোকানের সামনের প্রধান ডিসপ্লে তাক..."
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
            />
          </div>
        </div>
      </FormModal>

      {/* MODAL 5: FULL PRODUCT SPECIFICATION AUDIT MODAL */}
      {viewProduct && (
        <Modal
          isOpen={Boolean(viewProduct)}
          onClose={() => setViewProduct(null)}
          title="পণ্যের পূর্ণ বিবরণ ও স্পেসিফিকেশন"
          description={`বারকোড: #${viewProduct.barcode}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border flex items-center justify-center shrink-0">
                {viewProduct.image ? (
                  <Image src={viewProduct.image} alt={viewProduct.name} width={64} height={64} className="w-16 h-16 object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{viewProduct.name}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${viewProduct.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-neutral-100 text-neutral-500"
                    }`}>
                    {viewProduct.status}
                  </span>
                </div>
                {viewProduct.nameEn && <p className="text-xs text-neutral-400">{viewProduct.nameEn}</p>}
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>ক্যাটাগরি: <strong>{viewProduct.categoryName}</strong></span>
                  <span>•</span>
                  <span>ব্র্যান্ড: <strong>{viewProduct.brandName || "Unbranded"}</strong></span>
                  <span>•</span>
                  <span>তাক: <strong>{viewProduct.sectionName || "General Storage"}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">বারকোড</span>
                <span className="font-mono font-bold">{viewProduct.barcode}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">SKU Code</span>
                <span className="font-mono font-bold">{viewProduct.sku}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border">
              {canViewCost && (
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold">ক্রয় দর</span>
                  <span className="text-xs font-bold font-mono">{currencySymbol}{viewProduct.costPrice.toFixed(2)}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">খুচরা দর</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {currencySymbol}{viewProduct.sellingPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold">পাইকারি দর</span>
                <span className="text-xs font-bold font-mono">
                  {viewProduct.wholesalePrice ? `${currencySymbol}${viewProduct.wholesalePrice.toFixed(2)}` : "—"}
                </span>
              </div>
              {canViewCost && (
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold">মার্জিন</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    {viewProduct.sellingPrice > 0 ? `${(((viewProduct.sellingPrice - viewProduct.costPrice) / viewProduct.sellingPrice) * 100).toFixed(1)}%` : "0%"}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">ব্রাঞ্চ স্টক</span>
                <span className="font-bold font-mono">{viewProduct.stockQuantity} {viewProduct.unitCode}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">অ্যালার্ট সীমা</span>
                <span className="text-amber-600 font-bold font-mono">{viewProduct.minStockAlert} {viewProduct.unitCode}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">মেয়াদ</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1 font-mono">
                  <Calendar size={12} className="text-neutral-400" />
                  {viewProduct.expiryDate || "মেয়াদহীন"}
                </span>
              </div>
            </div>

            {(viewProduct.conversionFactor ?? 0) > 1 && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 font-medium">
                📦 <strong>বাল্ক প্যাকেজিং রূপান্তর:</strong> ১ {viewProduct.bulkUnitName || "কার্টন"} = {viewProduct.conversionFactor} {viewProduct.unitName || ""} ({viewProduct.unitCode})
              </div>
            )}

            {viewProduct.description && (
              <div>
                <span className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">বিবরণ</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
                  {viewProduct.description}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4 CONFIRM DELETION DIALOGS */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProductConfirm}
        title="পণ্য মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteProductTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="পণ্য মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteBrandTarget)}
        onClose={() => setDeleteBrandTarget(null)}
        onConfirm={handleDeleteBrandConfirm}
        title="ব্র্যান্ড মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteBrandTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="ব্র্যান্ড মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteSectionTarget)}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={handleDeleteSectionConfirm}
        title="তাক বা সেকশন মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteSectionTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="তাক মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteUnitTarget)}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnitConfirm}
        title="পরিমাপ একক মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteUnitTarget?.name}" এককটি মুছে ফেলতে চান?`}
        confirmLabel="একক মুছুন"
        loading={loading}
      />
    </div>
  );
}