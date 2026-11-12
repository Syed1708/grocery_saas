"use client";

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
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProductFilterBar, { StockStatusFilter } from "./ProductFilterBar";
import BarcodeSheetModal from "./modals/BarcodeSheetModal";

// Sub-components
import BrandsTab from "./tabs/BrandsTab";
import SectionsTab from "./tabs/SectionsTab";
import UnitsTab from "./tabs/UnitsTab";
import ProductFormModal from "./modals/ProductFormModal";
import ViewProductModal from "./modals/ViewProductModal";
import BrandModal from "./modals/BrandModal";
import SectionModal from "./modals/SectionModal";

// Server Actions
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
import { deleteUnitAction } from "@/app/actions/unit-actions";

import { IProduct, ICategoryOption, IUnitOption } from "@/types";

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
  "use no memo"; // 👈 Suppresses TanStack Table React compiler warnings

  const [activeTab, setActiveTab] = useState<
    "products" | "brands" | "sections" | "units"
  >("products");
  const [loading, setLoading] = useState(false);

  // Modal Targets
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<IProduct | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<IProduct | null>(null);
  const [barcodePrintProduct, setBarcodePrintProduct] =
    useState<IProduct | null>(null);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ExtraOption | null>(null);
  const [deleteBrandTarget, setDeleteBrandTarget] =
    useState<ExtraOption | null>(null);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ExtraOption | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] =
    useState<ExtraOption | null>(null);

  const [deleteUnitTarget, setDeleteUnitTarget] =
    useState<IUnitOption | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  const canViewCost = userRole === "OWNER" || userRole === "MANAGER";

  // Auto-open modal when navigating from Stock Report
  useEffect(() => {
    if (autoViewBarcode && data.length > 0) {
      const match = data.find(
        (p) => p.barcode === autoViewBarcode || p.sku === autoViewBarcode
      );
      if (match) setViewProduct(match);
    }
  }, [autoViewBarcode, data]);

  // Reactive Filter Engine
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.name?.toLowerCase().includes(q) ||
          item.nameEn?.toLowerCase().includes(q) ||
          item.barcode?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (selectedBrand && item.brandId !== selectedBrand) return false;
      if (selectedSection && item.sectionId !== selectedSection) return false;

      const stock = Number(item.stockQuantity || 0);
      const alert = Number(item.minStockAlert || 5);

      if (stockStatus === "IN_STOCK" && stock <= alert) return false;
      if (stockStatus === "LOW_STOCK" && (stock > alert || stock <= 0)) return false;
      if (stockStatus === "OUT_OF_STOCK" && stock > 0) return false;

      return true;
    });
  }, [data, searchQuery, selectedCategory, selectedBrand, selectedSection, stockStatus]);

  // Form Submissions
  async function handleProductSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingProduct) formData.append("id", editingProduct.id);

    const res = editingProduct
      ? await updateProductAction(formData)
      : await createProductAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(
        editingProduct ? "পণ্য তথ্য সফলভাবে আপডেট হয়েছে!" : "নতুন পণ্য ক্যাটালগে যুক্ত হয়েছে!"
      );
      setProductModalOpen(false);
      setEditingProduct(null);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  async function handleBrandSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingBrand) formData.append("id", editingBrand.id);

    const res = editingBrand
      ? await updateBrandAction(formData)
      : await createBrandAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingBrand ? "ব্র্যান্ড আপডেট হয়েছে!" : "নতুন ব্র্যান্ড তৈরি হয়েছে!");
      setBrandModalOpen(false);
      setEditingBrand(null);
    } else {
      toast.error(res.error || "ব্র্যান্ড সংরক্ষণ করা সম্ভব হয়নি।");
    }
  }

  async function handleSectionSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingSection) formData.append("id", editingSection.id);

    const res = editingSection
      ? await updateSectionAction(formData)
      : await createSectionAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingSection ? "তাক বা সেকশন আপডেট হয়েছে!" : "নতুন তাক তৈরি হয়েছে!");
      setSectionModalOpen(false);
      setEditingSection(null);
    } else {
      toast.error(res.error || "তাক সংরক্ষণ করা সম্ভব হয়নি।");
    }
  }

  // TanStack Table Columns
  const columns: ColumnDef<IProduct>[] = [
    {
      accessorKey: "image",
      header: "ছবি",
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex items-center justify-center">
          {row.getValue("image") ? (
            <Image
              src={row.getValue("image")}
              alt=""
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm">📦</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "পণ্যের বিবরণ ও অবস্থান",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold block text-xs">
              {row.getValue("name")}
            </span>
            {row.original.status === "inactive" && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-neutral-100 text-neutral-500">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
            <span>{row.original.categoryName}</span>
            {row.original.brandName && (
              <span>
                • <strong className="text-blue-500">{row.original.brandName}</strong>
              </span>
            )}
            {row.original.sectionName && (
              <span>
                • <strong className="text-amber-500">[{row.original.sectionName}]</strong>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "barcode",
      header: "বারকোড",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border">
          <Barcode size={12} /> {row.getValue("barcode")}
        </span>
      ),
    },
    ...(canViewCost
      ? [
          {
            accessorKey: "costPrice",
            header: "ক্রয় দর",
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => (
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                {currencySymbol}
                {Number(row.getValue("costPrice")).toFixed(2)}
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
          <span className="font-bold text-xs font-mono block">
            {currencySymbol}
            {Number(row.getValue("sellingPrice")).toFixed(2)}
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
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md inline-flex items-center gap-1 w-fit ${
                isOut
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setBarcodePrintProduct(row.original)}
            className="p-1.5 text-neutral-500 hover:text-purple-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="বারকোড স্টিকার প্রিন্ট"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewProduct(row.original)}
            className="p-1.5 text-neutral-500 hover:text-emerald-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(row.original);
              setProductModalOpen(true);
            }}
            className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="পণ্য সম্পাদনা"
          >
            <Edit2 size={15} />
          </button>
          {userRole === "OWNER" && (
            <button
              type="button"
              onClick={() => setDeleteProductTarget(row.original)}
              className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="মুছে ফেলুন"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
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
      <Breadcrumbs items={[{ label: "ক্যাটালগ ও পণ্য ব্যবস্থাপনা" }]} />

      {/* 4 Primary Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: "products", label: `পণ্য তালিকা (${data.length})`, icon: Package },
            { key: "brands", label: `ব্র্যান্ড (${brands.length})`, icon: Building2 },
            { key: "sections", label: `তাক ও র্যাক (${sections.length})`, icon: Layers },
            { key: "units", label: `একক (${units.length})`, icon: Scale },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() =>
                setActiveTab(t.key as "products" | "brands" | "sections" | "units")
              }
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === t.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <div className="flex items-center gap-2 shrink-0">
            <DataTableViewOptions table={table} />
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন পণ্য যোগ
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
            units={units}
            brands={brands}
            sections={sections}
            onReset={() => {
              setSearchQuery("");
              setSelectedCategory("");
              setSelectedBrand("");
              setSelectedSection("");
              setStockStatus("ALL");
            }}
            isFiltered={Boolean(
              searchQuery ||
                selectedCategory ||
                selectedBrand ||
                selectedSection ||
                stockStatus !== "ALL"
            )}
          />
          <DataTable table={table} columns={columns} />
        </div>
      )}

      {/* TAB 2: BRANDS */}
      {activeTab === "brands" && (
        <BrandsTab
          brands={brands}
          onAdd={() => {
            setEditingBrand(null);
            setBrandModalOpen(true);
          }}
          onEdit={(b) => {
            setEditingBrand(b);
            setBrandModalOpen(true);
          }}
          onDelete={(b) => setDeleteBrandTarget(b)}
          userRole={userRole}
        />
      )}

      {/* TAB 3: SECTIONS */}
      {activeTab === "sections" && (
        <SectionsTab
          sections={sections}
          onAdd={() => {
            setEditingSection(null);
            setSectionModalOpen(true);
          }}
          onEdit={(s) => {
            setEditingSection(s);
            setSectionModalOpen(true);
          }}
          onDelete={(s) => setDeleteSectionTarget(s)}
          userRole={userRole}
        />
      )}

      {/* TAB 4: UNITS */}
      {activeTab === "units" && (
        <UnitsTab
          units={units}
          onDeleteUnit={(u) => setDeleteUnitTarget(u)}
          userRole={userRole}
        />
      )}

      {/* Modals with Clean Key-Reset Patterns */}
      <ProductFormModal
        key={editingProduct?.id || "new-prod-modal"}
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        sections={sections}
        units={units}
        loading={loading}
        currencySymbol={currencySymbol}
      />

      <BrandModal
        key={editingBrand?.id || "new-brand-modal"}
        isOpen={brandModalOpen}
        onClose={() => {
          setBrandModalOpen(false);
          setEditingBrand(null);
        }}
        onSubmit={handleBrandSubmit}
        editingBrand={editingBrand}
        loading={loading}
      />

      <SectionModal
        key={editingSection?.id || "new-section-modal"}
        isOpen={sectionModalOpen}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={handleSectionSubmit}
        editingSection={editingSection}
        loading={loading}
      />

      {viewProduct && (
        <ViewProductModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          canViewCost={canViewCost}
          currencySymbol={currencySymbol}
        />
      )}

      {barcodePrintProduct && (
        <BarcodeSheetModal
          product={barcodePrintProduct}
          onClose={() => setBarcodePrintProduct(null)}
          shopName={shopName}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Confirm Deletion Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={async () => {
          setLoading(true);
          const res = await deleteProductAction(deleteProductTarget!.id);
          setLoading(false);
          if (res.success) {
            toast.success("পণ্য মুছে ফেলা হয়েছে!");
            setDeleteProductTarget(null);
          } else toast.error(res.error);
        }}
        title="পণ্য মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteProductTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="পণ্য মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteBrandTarget)}
        onClose={() => setDeleteBrandTarget(null)}
        onConfirm={async () => {
          setLoading(true);
          const res = await deleteBrandAction(deleteBrandTarget!.id);
          setLoading(false);
          if (res.success) {
            toast.success("ব্র্যান্ড মুছে ফেলা হয়েছে!");
            setDeleteBrandTarget(null);
          } else toast.error(res.error);
        }}
        title="ব্র্যান্ড মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteBrandTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="ব্র্যান্ড মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteSectionTarget)}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={async () => {
          setLoading(true);
          const res = await deleteSectionAction(deleteSectionTarget!.id);
          setLoading(false);
          if (res.success) {
            toast.success("তাক মুছে ফেলা হয়েছে!");
            setDeleteSectionTarget(null);
          } else toast.error(res.error);
        }}
        title="তাক বা সেকশন মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteSectionTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="তাক মুছুন"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteUnitTarget)}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={async () => {
          setLoading(true);
          const res = await deleteUnitAction(deleteUnitTarget!.id);
          setLoading(false);
          if (res.success) {
            toast.success("একক মুছে ফেলা হয়েছে!");
            setDeleteUnitTarget(null);
          } else toast.error(res.error);
        }}
        title="পরিমাপ একক মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteUnitTarget?.name}" এককটি মুছে ফেলতে চান?`}
        confirmLabel="একক মুছুন"
        loading={loading}
      />
    </div>
  );
}