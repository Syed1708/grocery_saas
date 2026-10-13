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
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import {
  ProductFilterBar,
  StockStatusFilter,
} from "@/components/common/data-table/ProductFilterBar";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ImageUpload from "@/components/common/ImageUpload";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/actions/product-actions";
import {
  createUnitAction,
  deleteUnitAction,
  seedDefaultUnitsAction,
} from "@/app/actions/unit-actions";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";
import Image from "next/image";

export default function ProductsClient({
  data,
  categories,
  units,
  currencySymbol = "$",
}: {
  data: IProduct[];
  categories: ICategoryOption[];
  units: IUnitOption[];
  currencySymbol?: string;
}) {
  // Tabs: Products vs Units (No Modals for switching!)
  const [activeTab, setActiveTab] = useState<"products" | "units">("products");

  // Product Form State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<IProduct | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<IUnitOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [hasBulkPackaging, setHasBulkPackaging] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("");
    setStockStatus("ALL");
  }

  const isFiltered = Boolean(searchQuery || selectedCategory || stockStatus !== "ALL");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBarcode = item.barcode.toLowerCase().includes(query);
        if (!matchesName && !matchesBarcode) return false;
      }
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (stockStatus === "IN_STOCK") {
        if (item.stockQuantity <= item.minStockAlert) return false;
      } else if (stockStatus === "LOW_STOCK") {
        if (item.stockQuantity > item.minStockAlert || item.stockQuantity <= 0) return false;
      } else if (stockStatus === "OUT_OF_STOCK") {
        if (item.stockQuantity > 0) return false;
      }
      return true;
    });
  }, [data, searchQuery, selectedCategory, stockStatus]);

  function openCreateProduct() {
    setEditingProduct(null);
    setBarcodeInput("");
    setHasBulkPackaging(false);
    setProductModalOpen(true);
  }

  function openEditProduct(product: IProduct) {
    setEditingProduct(product);
    setBarcodeInput(product.barcode);
    setHasBulkPackaging(Boolean(product.bulkUnitName && product.conversionFactor > 1));
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
        editingProduct ? "Product updated successfully!" : "Product created successfully!"
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

  // Inline Unit Actions
  async function handleCreateUnit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createUnitAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Measurement unit created successfully!");
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
                alt={row.getValue("name")}
                width={40}
                height={40}
                className="object-cover w-full h-full"
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
      header: "Product Name",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.getValue("name")}
          </span>
          <span className="text-[11px] text-neutral-400">
            {row.original.categoryName}
          </span>
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
      header: "Cost Price",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400">
          {currencySymbol}{Number(row.getValue("costPrice")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "sellingPrice",
      header: "Selling Price",
      cell: ({ row }) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100">
          {currencySymbol}{Number(row.getValue("sellingPrice")).toFixed(2)}
        </span>
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
            {row.original.conversionFactor > 1 && (
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEditProduct(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteProductTarget(product)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete"
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
      {/* Tab Switcher (No Modals!) */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "products"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Package size={15} /> Products Catalog ({data.length})
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "units"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Scale size={15} /> Measurement Units ({units.length})
          </button>
        </div>

        {activeTab === "products" && (
          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
            <button
              onClick={openCreateProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <ProductFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            stockStatus={stockStatus}
            onStockStatusChange={setStockStatus}
            categories={categories}
            onReset={handleResetFilters}
            isFiltered={isFiltered}
          />
          <DataTable table={table} columns={columns} />
        </div>
      )}

      {/* TAB 2: INLINE UNITS MANAGEMENT */}
      {activeTab === "units" && (
        <div className="space-y-6">
          {units.length === 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-center space-y-2">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                You haven&apos;t configured any measurement units yet.
              </p>
              <button
                type="button"
                onClick={handleLoadDefaultUnits}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
              >
                Load 10 Standard Units (kg, pcs, ltr...)
              </button>
            </div>
          )}

          {/* Inline Form to Add Unit */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Add New Measurement Unit
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
                  placeholder="e.g. Carton, Sachet, Tin, Box"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Short Symbol / Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g. ctn, sch, tin"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                Create Unit
              </button>
            </form>
          </div>

          {/* Units Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Active Units in Store ({units.length})
              </span>
              <button
                type="button"
                onClick={handleLoadDefaultUnits}
                disabled={loading}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                + Reset / Reload 10 Standard Units
              </button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {units.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 text-xs hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <Scale size={16} className="text-neutral-400" />
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Used by {u._count.products} products
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {u.code}
                    </span>

                    <button
                      onClick={() => setDeleteUnitTarget(u)}
                      disabled={u._count.products > 0}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title={
                        u._count.products > 0
                          ? "Cannot delete unit: in use by products"
                          : "Delete unit"
                      }
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

      {/* Reusable FormModal for Products */}
      <FormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        title={editingProduct ? "Edit Product" : "New Grocery Product"}
        description="Configure barcode, pricing, base measurement unit, and bulk conversion."
        isEditing={Boolean(editingProduct)}
        loading={loading}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingProduct?.name || ""}
              placeholder="e.g. Basmati Rice 5kg, Coca Cola 500ml"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Description / Notes (Optional)
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editingProduct?.description || ""}
            placeholder="Brand name, shelf location, or extra notes..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Barcode Section */}
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
              <Sparkles size={12} /> Auto-Generate
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

        {/* Pricing & Unit */}
        <div className="grid grid-cols-3 gap-3">
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
              Selling Price ({currencySymbol}) *
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
        </div>

        {/* Stock & Warning Level */}
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
              Low-Stock Warning Level
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

        {/* Optional Checkbox for Bulk Packaging */}
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
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
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

        <ImageUpload
          name="image"
          defaultImage={editingProduct?.image}
          label="Product Photo"
        />
      </FormModal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProductConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProductTarget?.name}"? Its image will also be removed from disk.`}
        confirmLabel="Delete Product"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteUnitTarget)}
        onClose={() => setDeleteUnitTarget(null)}
        onConfirm={handleDeleteUnitConfirm}
        title="Delete Measurement Unit"
        message={`Are you sure you want to delete unit "${deleteUnitTarget?.name}"?`}
        confirmLabel="Delete Unit"
        loading={loading}
      />
    </div>
  );
}