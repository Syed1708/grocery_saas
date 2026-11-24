---
name: nextjs-saas-module-pattern
description: Build or refactor an admin CRUD module in the grocery-pos-saas Next.js app using the standard module pattern — requireAuth server guards with RBAC permissions, Prisma queries, useCrudModal, FormField forms, DataTable + TableHelpers, and the StatCard / ModuleHeader / SearchFilterBar generics — while preserving the existing UI. Use when adding a new admin module (page, actions, client, form) or converting an existing one to the codebase conventions.
---

# Next.js SaaS Module Pattern (grocery-pos-saas)

This skill is the canonical way to build or refactor an admin module in this repo. The
`app/dashboard/admin/categories` module is the reference implementation; `customers` and
`units` follow it too. Match it exactly so code stays small and consistent.

## Non-negotiables

1. **Security first.** Every page and every server action starts with `requireAuth(...)`.
   Never call `getServerSession(authOptions)` outside `lib/auth/guard.ts`. Prefer a
   permission over a role; use roles only when the rule is truly role-based.
2. **Preserve the UI.** The user cares about visuals. Keep titles, copy, colors, spacing, and
   column content identical unless explicitly asked to change them. Reuse shared primitives so
   the rendered markup is the same.
3. **No `any`.** Never introduce `any`. Type Prisma results, use `unknown` + narrowing in
   `catch`, and give generic helpers real prop types.
4. **Verify before finishing.** Run typecheck + build (see Verification). Fix anything you break.

## Module file layout

```
app/dashboard/admin/<module>/
  page.tsx                     # server: requireAuth + query + render client
  _components/
    <Module>Client.tsx         # client: useCrudModal + table + modals
    <Module>Form.tsx           # client: FormField-only form
app/actions/<module>-actions.ts # server actions: requireAuth on every mutation
queries/<module>-queries.ts     # Prisma, shop/branch scoped, typed payloads
types/<module>.ts               # interfaces
lib/validations/...             # zod schema (already used by the actions)
```

## Layer 1 — `page.tsx`

```tsx
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getThings } from "@/queries/thing-queries";
import { prisma } from "@/lib/prisma";
import ThingsClient from "./_components/ThingsClient";

export default async function ThingsPage() {
  const { shopId, activeBranchId, role } = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_VIEW, // or the relevant permission
    requireActiveStatus: true,
  });

  const [things, shop] = await Promise.all([
    getThings(shopId, activeBranchId),
    prisma.shop.findUnique({ where: { id: shopId }, select: { currencySymbol: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ThingsClient data={things} currencySymbol={shop?.currencySymbol || "৳"} userRole={role} />
    </div>
  );
}
```

`requireAuth` returns `{ userId, shopId, role, activeBranchId }`. `activeBranchId` is a
guaranteed string. It throws on failure (dashboard error boundary), so do not add
`redirect("/login")`. Pages that are OWNER/MANAGER-only pass `allowedRoles`.

## Layer 2 — queries

Shop-scoped, branch-aware, return plain serializable objects (convert Prisma `Decimal` with
`Number(...)`). Never trust the client for `shopId`/`branchId`. Project only the columns the UI
needs with `select` (faster payloads) rather than fetching whole rows.

```ts
export async function getThings(shopId: string, branchId?: string | null): Promise<IThing[]> {
  const rows = await prisma.thing.findMany({
    where: { shopId, ...(branchId ? { branchId } : {}) },
    select: { id: true, name: true, status: true, branchId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ ...r, /* Number() decimals */ }));
}
```

## Layer 3 — server actions

Every exported action begins with `requireAuth` using the mutation permission. Wrap body in
`try/catch`; narrow the error, never `catch (error: any)`.

```ts
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { thingSchema } from "@/lib/validations";

export async function createThingAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const parsed = thingSchema.safeParse({ name: formData.get("name")?.toString().trim() });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    await prisma.thing.create({ data: { ...parsed.data, shopId: user.shopId } });
    revalidatePath("/dashboard/admin/things");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create thing." };
  }
}
```

Delete actions: verify ownership with `findFirst({ where: { id, shopId } })` before mutating.
If the module needs owner-only deletion, check `user.role !== "OWNER"` and return a clear error.

### Shared server helpers (DRY)

Extract these once per action module instead of repeating them:

```ts
import { getErrorMessage } from "@/lib/utils"; // unknown -> string, no `any`

const THING_REVALIDATE_PATHS = ["/dashboard/admin/things", "/pos"];
function revalidateThingPaths() {
  for (const p of THING_REVALIDATE_PATHS) revalidatePath(p);
}

/** One form -> zod mapper shared by create + update. */
function formToThingInput(formData: FormData, includeOpening = false) {
  return {
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString().trim(),
    // ...
    ...(includeOpening ? { openingBalance: formData.get("openingBalance") || 0 } : {}),
  };
}

/** Shared Prisma columns for create + update. */
function thingFields(data: { name: string }) {
  return { name: data.name /* ... */ };
}
```

- Use `getErrorMessage(error, fallback)` in every `catch` — never `catch (error: any)`.
- Branch-scope non-owners with a helper:
  `function branchScope(user) { return user.role === "OWNER" ? {} : { OR: [{ branchId: user.activeBranchId }, { branchId: null }] }; }`
  (use `{ branchId: user.activeBranchId }` when global/shared records don't apply).
- Verify ownership before mutating: `findFirst({ where: { id, shopId, ...branchScope(user) } })`.
- Keep a module-level `*_REVALIDATE_PATHS` list and a `revalidate*Paths()` helper.

## Layer 4 — `<Module>Client.tsx`

```tsx
"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ModuleHeader } from "@/components/common/ModuleHeader";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { useCrudModal } from "@/hooks/useCrudModal";
import { createThingAction, updateThingAction, deleteThingAction } from "@/app/actions/thing-actions";
import { PERMISSIONS } from "@/types";
import ThingForm from "./ThingForm";

export default function ThingsClient({ data, userRole }: Props) {
  const crud = useCrudModal<IThing>({
    createAction: createThingAction,
    updateAction: updateThingAction,
    deleteAction: deleteThingAction,
    entityName: "পণ্য", // Bangla entity name -> standardized toasts
  });

  // Declare columns exactly like categories:
  const columns: ColumnDef<IThing>[] = [
    { accessorKey: "name", header: "নাম", cell: ({ row }) => <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">{row.getValue("name")}</span> },
    {
      id: "actions",
      header: "অ্যাকশন",
      enableHiding: false,
      cell: ({ row }) => (
        <TableActions
          onEdit={() => crud.openEdit(row.original)}
          editPermission={PERMISSIONS.CATALOG_MANAGE}
          onDelete={() => crud.setDeleteTarget(row.original)}
          canDelete={userRole === "OWNER"} // omit if everyone may delete
          deletePermission={PERMISSIONS.CATALOG_MANAGE}
        />
      ),
    },
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="…"
        subtitle="…"
        actions={/* optional <DataTableViewOptions table={table} /> */}
        onAdd={crud.openCreate}
        addLabel="নতুন যোগ"
        addPermission={PERMISSIONS.CATALOG_MANAGE}
      />

      <DataTable table={table} columns={columns} />

      <FormModal
        key={crud.editingItem?.id || "new-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? "সম্পাদনা" : "নতুন"}
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
        submitLabel={crud.editingItem ? "আপডেট করুন" : "যোগ করুন"}
      >
        <ThingForm thing={crud.editingItem} errors={crud.errors} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="মুছে ফেলুন"
        message={`আপনি কি নিশ্চিত "${crud.deleteTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="মুছুন"
        loading={crud.loading}
      />
    </div>
  );
}
```

`useCrudModal` gives: `isOpen, editingItem, deleteTarget, loading, errors, setErrors,
openCreate, openEdit, closeModal, setDeleteTarget, handleSubmit, handleDeleteConfirm`, plus
optional `viewingItem/openView/closeView` and `printingItem/openPrint/closePrint`.

## Layer 5 — `<Module>Form.tsx`

Markup only, all inputs via `FormField` (supports `text|number|email|password|date|textarea|select|image|checkbox`, plus `step/min/max/hint/error`). Pass `errors` from the hook.

```tsx
<FormField type="text" label="নাম" name="name" required defaultValue={thing?.name} error={errors.name} />
<FormField type="select" label="স্ট্যাটাস" name="status" defaultValue={thing?.status || "active"}
  options={[{ label: "সক্রিয়", value: "active" }, { label: "নিষ্ক্রিয়", value: "inactive" }]} />
```

### Typed form layer (no `any[]`)

- Define input types instead of `any[]` — e.g. `IPurchaseProductInput`, `IPurchaseSupplierOption`,
  `IXFormInitialData`. Products/suppliers from queries (`IProduct[]`, `ISupplier[]`) are
  structurally assignable; drop `as any` casts on page props.
- Numeric helpers take `unknown`: `sanitizeNumber(v: unknown)`; row update handlers take
  `value: string | number` for `keyof Row`.
- Build payloads as the shared action type (`CreateXPayload`), and on edit spread `id` when calling
  `updateXAction`. Guard `mode === "edit" && !initialData?.id` first.
- Never call impure functions (`Date.now()`, `new Date()`) during render. Generate codes in a
  module-scope helper or a `useState` lazy initializer; format dates in a module-scope helper.
- Modal submit prop type is `(e: React.SubmitEvent<HTMLFormElement>) => void` (matches `FormModal`).

## Shared UI generics (use these, don't hand-roll)

| Component | Path | Use |
|---|---|---|
| `StatCard` | `@/components/common/StatCard` | KPI/summary cards. `tone`: neutral/rose/emerald/info/blue/amber. |
| `ModuleHeader` | `@/components/common/ModuleHeader` | Title + subtitle + right actions + Add button. `titleClassName` overrides size. |
| `SearchFilterBar` | `@/components/common/SearchFilterBar` | Search box + optional filter pills. |
| `Breadcrumbs` | `@/components/common/Breadcrumbs` | `items={[{ label, href? }]}`. |
| `TableActions` | `@/components/common/ui/table/TableHelpers` | Row edit/delete/view/print with `PermissionGate`. |
| `StatusBadge` / `TableImage` | same file | Status pills and image thumbs. |
| `DataTable` + `DataTableViewOptions` | `@/components/common/data-table/*` | Table render + column visibility. |
| `PermissionGate` | `@/components/common/PermissionGate` | Wrap UI by permission. |
| `FormModal` / `ConfirmDialog` / `Modal` | `@/components/common/*` | Modals. |

For a KPI grid: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">` with
`StatCard`s.

### Data tables & pagination (required)

`DataTable` ALWAYS renders `DataTablePagination`, so every table must register the pagination
model or the controls (first/prev/next/last, page size) silently do nothing:

```tsx
const table = useReactTable({
  data,
  columns, // ColumnDef<T>[]
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(), // 👈 required
  // optional: getFilteredRowModel(), state/onStateChange...
});
```

Check every new/edited table for `getPaginationRowModel` — this was the root cause of "pagination
and its action buttons don't work" in expenses, purchases and several report tables.

## RBAC

- `UserRole` = `"OWNER" | "MANAGER" | "CASHIER"` (`types/rbac.ts`). Never compare against
  `ADMIN`/`SUPER_ADMIN` — they do not exist.
- Permissions: `PERMISSIONS.*` in `types/rbac.ts`; `DEFAULT_ROLE_PERMISSIONS` maps roles.
- Middleware `proxy.ts` guards `/dashboard/:path*`; CASHIER is limited to POS/closings/profile.
  A page's `requireAuth` permission is the real enforcement.

### Permission mapping (defaults)

| Domain | View | Mutate |
|---|---|---|
| Catalog & inventory | `CATALOG_VIEW` | `CATALOG_MANAGE`, `INVENTORY_ADJUST`, `INVENTORY_TRANSFER`, `INVENTORY_WASTAGE` |
| Customers & khata | `CUSTOMERS_VIEW` | `CUSTOMERS_MANAGE` (delete OWNER-only) |
| Purchases | `PURCHASES_VIEW` | `PURCHASES_MANAGE` |
| Suppliers | `SUPPLIERS_VIEW` | `SUPPLIERS_MANAGE`; payout → `SUPPLIERS_PAY` |
| POS | `POS_ACCESS` | `POS_DISCOUNT_OVERRIDE`, `POS_PRICE_EDIT`, `POS_REFUND_RETURN`, `POS_DRAWER_OPEN` |
| Finance / accounts | `FINANCE_*` | `FINANCE_*` |
| Reports | `REPORTS_OVERVIEW`, `REPORTS_SALES`, `REPORTS_PURCHASES`, `REPORTS_STOCK`, `REPORTS_CUSTOMER_DUE`, `REPORTS_EXPENSES`, `REPORTS_CLOSING_Z`, `REPORTS_PL_PROFIT`, `REPORTS_EXPORT` | — |
| Administration | — | `STAFF_MANAGE`, `STAFF_PAYROLL`, `USERS_MANAGE`, `SETTINGS_STORE`, `BRANCH_MANAGE`, `BRANCH_SWITCH`, `FAMILY_LEDGER_ACCESS` |

Owner-only deletes: check `user.role !== "OWNER"` and return a localized error.

**Finance specifics:** accounts / cheques / fund transfers require `FINANCE_BANKING`; expenses,
incomes, company assets and owner equity require `FINANCE_EXPENSES`; loans & installments require
`FINANCE_LOANS`. Verify rows belong to `shopId` + `activeBranchId` before mutating (company assets
also allow `branchId: null` for head-office assets). Resolve transfer/clear-cheque accounts inside
the active branch. CRUD entities use `useCrudModal`; one-off actions (transfer, clear cheque, pay
installment) may keep a small manual modal + loading state.

**Payment methods (single source of truth):** never hardcode a payment-method list in a form or
filter. Import from `@/lib/payment-methods`:
`PAYMENT_METHODS` / `PAYMENT_METHOD_OPTIONS` (`cash`, `bank`, `bkash`, `nagad`, `rocket`),
`normalizePaymentMethod()`, `accountTypeForPaymentMethod()`, `paymentMethodLabel()`. Every module —
expenses, income, assets, equity, purchases, purchase returns, supplier payments, customer due
collection, POS split payments and report filters — must offer these same five values and resolve
the matching branch account with `accountTypeForPaymentMethod()`. POS split stores all five inside
the `SPLIT:{...}` notes tag and its receipts print them. Unknown values normalize to `cash`;
`non_cash` is an internal write-off marker and must never move an account.

**Cash reconciliation:** any financial create/update/delete that touches an account must keep the
drawer in sync. Resolve the account from the form's `paymentMethod` (`cash` → CASH, `bank` → BANK,
`bkash` → BKASH, `nagad` → NAGAD, `rocket` → ROCKET) within `shopId` + `activeBranchId`;
if none exists return a clear error telling the user to create that account. On create post an
`AccountTransaction` tagged with `referenceType` (EXPENSE / INCOME / ASSET / EQUITY) and
`referenceId` = record id. On edit, reverse the existing entries for that reference (using each
entry's own account and `type` to decide the direction), then re-apply with the new amount/method;
on delete, reverse and remove. Do all of it inside one `prisma.$transaction`. Legacy rows without a
reference fall back to their old CASH effect. Never edit/delete an expense or income without
adjusting the correct account.

**Catalog / products:** create & update require `CATALOG_MANAGE`, delete is OWNER-only, and stock
adjustments require `INVENTORY_ADJUST`. Always validate submitted foreign ids (`categoryId`,
`unitId`, `brandId`, `sectionId`) with `{ id, shopId }` before writing — never trust a client id.
Stock is read/written only for the active branch (`productStock`), while products themselves stay
shop-level. Brand and section actions use `CATALOG_MANAGE` (brand delete is OWNER-only) and verify
`{ id, shopId }` before update/delete. The products client runs three `useCrudModal` engines
(product / brand / section); units keep their own inline create + guarded delete. Revalidate
`/dashboard/admin/products`, `/dashboard/pos`, `/dashboard` and `/dashboard/admin/reports/stock`.
Uploads go through `saveUploadedFile`, which enforces a 5 MB limit and an allow-list of image/PDF
MIME types.

**Printing:** never print a sheet that lives inside a modal/scroll container. Render a dedicated
print root with `createPortal(..., document.body)`, hide it on screen (`display:none`) and in
`@media print` hide every other direct body child (`body > *:not(#print-root)`), then show the
root. Group content into explicit pages (e.g. 24 barcode stickers per A4 page) with
`break-after: page`; set `@page { size: A4 portrait; margin: 4mm }`, `break-inside: avoid` on each
card, and `print-color-adjust: exact`. Use `useSyncExternalStore` (not setState-in-effect) for the
mounted check before creating a portal. SVG barcodes need quiet zones on both sides,
`shape-rendering="crispEdges"` and `preserveAspectRatio="none"`.

**Family ledger:** everything requires `FAMILY_LEDGER_ACCESS` (page, sidebar and report tab).
Queries take `(shopId, branchId, …)` from the guarded page and never authenticate again; partner
balances are computed from branch-scoped transactions (`CAPITAL_INJECTION` adds, everything else
subtracts) and branch-scoped rations. Writes verify `partnerId` and `productId` belong to the shop,
verify `accountId` belongs to the active branch, block drawings above the account balance, and
guard stock with `updateMany({ quantity: { gte } })`. Every drawing/injection writes both an
`AccountTransaction` (`referenceType: "PARTNER"`) and the partner transaction. Partner create and
update are separate actions (the client uses `useCrudModal`). Drawings/bills and grocery rations
also support edit and delete: editing a drawing reverses the old account effect then applies the
new one; deleting reverses it. Editing/deleting a ration restores the old stock lines before
re-applying/deleting, so stock never drifts. The report lives at
`/dashboard/admin/reports/family` (CSV + A4 PDF) and is listed in the reports nav and overview grid.

**Stock transfers & wastage:** the stock page uses `requiredAnyPermission: [INVENTORY_TRANSFER,
INVENTORY_WASTAGE]` (guard supports `requiredAnyPermission`). Dispatch/update/cancel require
`INVENTORY_TRANSFER` and are limited to the source branch; receive requires the destination branch.
Wastage create/update require `INVENTORY_WASTAGE`, delete is OWNER-only, and every lookup is scoped
by `{ id, shopId, activeBranchId }`. Value transfers and losses at `product.purchasePrice` from the
DB — never trust client `unitCost`. Verify destination/product ids belong to the shop, reject
duplicate product lines by merging quantities, guard stock with
`updateMany({ quantity: { gte } })`, and restore with `upsert` + increment so rollbacks work even if
a stock row was missing. Receiving must reconcile every line (`received + damaged === sent`) and
auto-log transit damage as a branch wastage. Transfer statuses: DISPATCHED → COMPLETED/CANCELLED.

**Typed filters:** dynamic report filters must use Prisma input types (e.g.
`Prisma.PurchaseWhereInput`, `Prisma.SaleWhereInput`, `Prisma.ProductStockWhereInput`,
`Prisma.DateTimeFilter`) — never `const where: any`. Cast enum strings to the generated enum type
(`PaymentStatus`, `PurchaseOrderStatus`, etc.) and type accumulated event rows with their shared
interface instead of `any[]`.

**Session revocation:** `User.tokenVersion` is stored in the JWT. Password changes, role changes,
deactivation, branch reassignment and custom-permission changes increment it. The `jwt` callback
re-checks the DB and flags the token revoked; `requireAuth` always re-reads the user and rejects a
stale `tokenVersion`; middleware only authorizes tokens with `shopId` and no `revoked` flag.
Changing your own password intentionally logs the current session out.

**CSP & headers:** `next.config.ts` sets a Content-Security-Policy plus nosniff / frame / referrer /
permissions / HSTS headers. Keep `script-src 'unsafe-inline'` for Next and add `'unsafe-eval'` +
`ws:` only in development.

**CSV exports:** use `lib/csv.ts` (`csvCell`, `toCsv`, `downloadCsv`). It escapes quotes/commas and
neutralizes formula injection (`= + - @`). Never hand-build CSV strings in report components.

**POS / sales / returns / closings:** checkout requires `POS_ACCESS`; voiding a sale is
OWNER-only, needs `requireActiveStatus`, and must load the sale by `{ id, shopId, activeBranchId }`.
Validate a submitted `customerId` with `{ id, shopId, OR: [{ branchId: active }, { branchId: null }] }`.
Returns viewing uses `POS_ACCESS` (the sidebar entry itself is gated by `POS_REFUND_RETURN`);
processing a return requires `POS_REFUND_RETURN`, whitelists `cash|balance`, re-checks remaining
quantity per product, and only refunds cash up to the amount actually paid. Cash-drawer lookups
always include `shopId` + `branchId`. Z-closings require `REPORTS_CLOSING_Z`, and the server
recomputes every total from `getCurrentShiftSummary` — the client may only submit `countedCash` and
`notes`; never trust client-sent shift totals. Print/history queries must include the return line
items plus branch and cashier names so reprints are complete.

**Loan corrections:** while `totalPaid === 0`, editing type/amount/due-date is allowed and the
linked account effect is reversed/applied atomically. After repayments, terms lock; the owner-only
`deleteLoanAction` voids the loan and rolls back the principal + every installment on their
accounts (balance-validated) so it can be re-created correctly.

### Routing & deep links

- App routes live under `/dashboard/...`. Never link to legacy `/admin/...` or `/reports/...`
  paths — they 404. Audit `href` values when touching a module.
- To open a modal from a link, read `searchParams` in the page and pass an initial id prop
  (e.g. `?supplierId=...` → seed the payment modal state). Initialize state from the prop —
  do not `setState` inside an effect.

### Data isolation (branch / tenant)

- Queries filter by `shopId` + `activeBranchId`.
- Mutations verify ownership before write: `findFirst({ id, shopId, branchId })`, then update/delete
  by `id`.
- Validate submitted foreign ids (`staffId`, `departmentId`, `supplierId`, `productId`) belong to
  the shop/branch before creating records — don't trust hidden form fields.

### Navigation & permission UI

- `components/dashboard/Sidebar.tsx` builds `navItems` as
  `{ label, href, icon: LucideIcon, roles: UserRole[], permission?: PermissionKey }[]`.
  Filter by **both** role and `hasPermission`; OWNER bypasses permission checks.
- Keep the sidebar's CASHIER allow-list in sync with `proxy.ts`
  (`/dashboard/pos`, `/dashboard/admin/closings`, `/dashboard/profile`).
- `hooks/usePermission.ts` initializes from session overrides only when they exist, else
  `null` so it falls back to `DEFAULT_ROLE_PERMISSIONS` (avoids an empty-permissions flash).

### Users / RBAC module

- `admin/users` is **OWNER-only** (`requireAuth({ allowedRoles: ["OWNER"], requireActiveStatus: true })`).
- Hide the master Owner from the staff list (`role: { not: "OWNER" }`).
- Sanitize submitted `customPermissions` against `Object.values(PERMISSIONS)`; store `[]` for OWNER.
- Protect the sole active Owner from demotion/deactivation; block toggling/deleting OWNER accounts.

## UI preservation rules

- Don't change column order, headers, badges, or copy unless asked.
- Don't swap a custom-colored button for the default blue one; keep one-off action modals
  (e.g. a green payment modal) as-is.
- When extracting a repeated block into a generic, reproduce the original markup exactly and
  verify the module still renders the same.
- Keep Bangla copy verbatim (copy from the file, don't retype from memory).

## Verification (Windows)

`npm.ps1` is blocked by execution policy — use `npm.cmd`.

```powershell
npm.cmd exec -- tsc --noEmit
npm.cmd exec -- eslint <touched files/dirs>
npm.cmd run build
```

Expected: typecheck 0 errors; eslint 0 errors (the TanStack `react-hooks/incompatible-library`
warning is pre-existing and acceptable); build succeeds.

## Checklist before finishing

- [ ] Page and every action use `requireAuth` (no `getServerSession`).
- [ ] Permissions/roles match intent (see mapping); owner-only deletes gated server-side.
- [ ] Queries scoped to `shopId`/`activeBranchId`; `select` only needed fields; decimals converted.
- [ ] Actions share `formToXInput`, `xFields`, `revalidateXPaths`, and branch scope — no duplication.
- [ ] All `catch` blocks use `getErrorMessage(error, fallback)`; never `catch (error: any)`.
- [ ] Client uses `useCrudModal`; columns are `ColumnDef<T>[]`; row actions use `TableActions`.
- [ ] Every table registers `getPaginationRowModel`.
- [ ] All links use `/dashboard/...`; no stale `/admin/...` hrefs.
- [ ] Mutations verify shop/branch ownership and foreign ids before writing.
- [ ] Form layer typed (no `any[]`); payloads use shared action types; no impure calls in render.
- [ ] Form uses `FormField` only and receives `errors`.
- [ ] No `any` introduced anywhere.
- [ ] UI text/layout unchanged (unless requested).
- [ ] `tsc`, `eslint`, `build` pass.
