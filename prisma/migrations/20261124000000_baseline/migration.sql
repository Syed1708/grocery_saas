-- CreateTable
CREATE TABLE `shops` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `tradeLicense` VARCHAR(191) NULL,
    `binVatNumber` VARCHAR(191) NULL,
    `currencySymbol` VARCHAR(191) NOT NULL DEFAULT '৳',
    `vatPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `enableVat` BOOLEAN NOT NULL DEFAULT false,
    `thermalWidth` VARCHAR(191) NOT NULL DEFAULT '80mm',
    `invoiceHeader` TEXT NULL,
    `invoiceFooter` TEXT NULL,
    `banglaReceipt` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `isMain` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `branches_shopId_idx`(`shopId`),
    UNIQUE INDEX `branches_shopId_code_key`(`shopId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `licenses` (
    `id` VARCHAR(191) NOT NULL,
    `licenseKey` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NOT NULL,
    `monthlyFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `expiresAt` DATETIME(3) NOT NULL,
    `gracePeriodDays` INTEGER NOT NULL DEFAULT 3,
    `bkashNumber` VARCHAR(191) NULL,
    `nagadNumber` VARCHAR(191) NULL,
    `supportPhone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `lastTrxId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `licenses_licenseKey_key`(`licenseKey`),
    INDEX `licenses_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MANAGER', 'CASHIER') NOT NULL DEFAULT 'CASHIER',
    `profileImage` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    `branchId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `supervisorPin` VARCHAR(191) NULL,
    `customPermissions` JSON NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_shopId_idx`(`shopId`),
    INDEX `users_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortCode` VARCHAR(191) NOT NULL,
    `allowDecimal` BOOLEAN NOT NULL DEFAULT false,
    `baseUnitId` VARCHAR(191) NULL,
    `conversionRate` DECIMAL(10, 4) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `units_shopId_idx`(`shopId`),
    UNIQUE INDEX `units_shopId_shortCode_key`(`shopId`, `shortCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_sections` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_sections_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `parentId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `categories_shopId_idx`(`shopId`),
    UNIQUE INDEX `categories_shopId_slug_key`(`shopId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `brands_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `purchasePrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sellingPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `wholesalePrice` DECIMAL(10, 2) NULL,
    `vatPercent` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `expiryDate` DATETIME(3) NULL,
    `alertQuantity` DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    `bulkUnitName` VARCHAR(191) NULL,
    `conversionFactor` DECIMAL(10, 2) NULL DEFAULT 1.00,
    `image` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sectionId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_shopId_idx`(`shopId`),
    INDEX `products_categoryId_idx`(`categoryId`),
    INDEX `products_brandId_idx`(`brandId`),
    INDEX `products_unitId_idx`(`unitId`),
    UNIQUE INDEX `products_shopId_barcode_key`(`shopId`, `barcode`),
    UNIQUE INDEX `products_shopId_sku_key`(`shopId`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_stocks` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `productId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_stocks_productId_idx`(`productId`),
    INDEX `product_stocks_branchId_idx`(`branchId`),
    UNIQUE INDEX `product_stocks_productId_branchId_key`(`productId`, `branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `openingDue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `currentDue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `suppliers_shopId_idx`(`shopId`),
    INDEX `suppliers_branchId_idx`(`branchId`),
    INDEX `suppliers_shopId_phone_idx`(`shopId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` VARCHAR(191) NOT NULL,
    `chalanNo` VARCHAR(191) NOT NULL,
    `chalanImageUrl` TEXT NULL,
    `purchaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `totalQuantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `transportCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `vatPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `vatAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `grandTotal` DECIMAL(10, 2) NOT NULL,
    `previousDue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `dueAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `paymentStatus` ENUM('PAID', 'PARTIAL', 'DUE') NOT NULL DEFAULT 'PAID',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `purchases_shopId_idx`(`shopId`),
    INDEX `purchases_branchId_idx`(`branchId`),
    INDEX `purchases_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `purchases_shopId_chalanNo_key`(`shopId`, `chalanNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `billedQuantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `damagedQuantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `missingQuantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchase_items_purchaseId_idx`(`purchaseId`),
    INDEX `purchase_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNo` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('DRAFT', 'SENT_TO_SR', 'CONVERTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `estimatedTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `purchase_orders_shopId_idx`(`shopId`),
    INDEX `purchase_orders_branchId_idx`(`branchId`),
    INDEX `purchase_orders_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `purchase_orders_shopId_orderNo_key`(`shopId`, `orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `currentStock` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchase_order_items_orderId_idx`(`orderId`),
    INDEX `purchase_order_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_payments` (
    `id` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `voucherNo` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_payments_branchId_idx`(`branchId`),
    INDEX `supplier_payments_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_wastages` (
    `id` VARCHAR(191) NOT NULL,
    `wastageNo` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalQuantity` DECIMAL(10, 2) NOT NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `reason` ENUM('ROTTEN_PERISHABLE', 'BROKEN_DAMAGED', 'EXPIRED_NO_RETURN', 'PEST_DAMAGE', 'INTERNAL_STORE_USE', 'OTHER') NOT NULL DEFAULT 'ROTTEN_PERISHABLE',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stock_wastages_shopId_idx`(`shopId`),
    INDEX `stock_wastages_branchId_idx`(`branchId`),
    UNIQUE INDEX `stock_wastages_shopId_wastageNo_key`(`shopId`, `wastageNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_wastage_items` (
    `id` VARCHAR(191) NOT NULL,
    `wastageId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `lineCost` DECIMAL(10, 2) NOT NULL,
    `reason` ENUM('ROTTEN_PERISHABLE', 'BROKEN_DAMAGED', 'EXPIRED_NO_RETURN', 'PEST_DAMAGE', 'INTERNAL_STORE_USE', 'OTHER') NOT NULL DEFAULT 'ROTTEN_PERISHABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_wastage_items_wastageId_idx`(`wastageId`),
    INDEX `stock_wastage_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transfers` (
    `id` VARCHAR(191) NOT NULL,
    `transferNo` VARCHAR(191) NOT NULL,
    `dispatchDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `receiveDate` DATETIME(3) NULL,
    `status` ENUM('DISPATCHED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DISPATCHED',
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `totalQuantity` DECIMAL(10, 2) NOT NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `vehicleNo` VARCHAR(191) NULL,
    `fromBranchId` VARCHAR(191) NOT NULL,
    `toBranchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stock_transfers_shopId_idx`(`shopId`),
    INDEX `stock_transfers_fromBranchId_idx`(`fromBranchId`),
    INDEX `stock_transfers_toBranchId_idx`(`toBranchId`),
    UNIQUE INDEX `stock_transfers_shopId_transferNo_key`(`shopId`, `transferNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transfer_items` (
    `id` VARCHAR(191) NOT NULL,
    `transferId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantitySent` DECIMAL(10, 2) NOT NULL,
    `quantityReceived` DECIMAL(10, 2) NULL,
    `transitDamage` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `lineCost` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_transfer_items_transferId_idx`(`transferId`),
    INDEX `stock_transfer_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_returns` (
    `id` VARCHAR(191) NOT NULL,
    `returnNo` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalQuantity` DECIMAL(10, 2) NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `refundAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `dueDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `settlementType` ENUM('DUE_DEDUCTION', 'CASH_REFUND', 'PARTIAL') NOT NULL DEFAULT 'DUE_DEDUCTION',
    `paymentMethod` VARCHAR(191) NULL DEFAULT 'cash',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `purchase_returns_shopId_idx`(`shopId`),
    INDEX `purchase_returns_branchId_idx`(`branchId`),
    INDEX `purchase_returns_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `purchase_returns_shopId_returnNo_key`(`shopId`, `returnNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_return_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `returnId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchase_return_items_returnId_idx`(`returnId`),
    INDEX `purchase_return_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `type` ENUM('WALK_IN', 'PERMANENT') NOT NULL DEFAULT 'PERMANENT',
    `village` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `creditLimit` DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
    `openingDue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `currentDue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customers_shopId_idx`(`shopId`),
    INDEX `customers_branchId_idx`(`branchId`),
    INDEX `customers_shopId_phone_idx`(`shopId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNo` VARCHAR(191) NOT NULL,
    `saleDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `vatPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `vatAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `grandTotal` DECIMAL(10, 2) NOT NULL,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `dueAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `changeAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'paid',
    `offlineUuid` VARCHAR(191) NULL,
    `isSynced` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_offlineUuid_key`(`offlineUuid`),
    INDEX `sales_shopId_idx`(`shopId`),
    INDEX `sales_branchId_idx`(`branchId`),
    INDEX `sales_customerId_idx`(`customerId`),
    UNIQUE INDEX `sales_shopId_invoiceNo_key`(`shopId`, `invoiceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `purchaseCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_items_saleId_idx`(`saleId`),
    INDEX `sale_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_payments` (
    `id` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `receiptNo` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `customer_payments_branchId_idx`(`branchId`),
    INDEX `customer_payments_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_returns` (
    `id` VARCHAR(191) NOT NULL,
    `returnNo` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalRefund` DECIMAL(10, 2) NOT NULL,
    `refundMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_returns_branchId_idx`(`branchId`),
    INDEX `sale_returns_saleId_idx`(`saleId`),
    UNIQUE INDEX `sale_returns_shopId_returnNo_key`(`shopId`, `returnNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_return_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `refundPrice` DECIMAL(10, 2) NOT NULL,
    `itemCondition` ENUM('RESTOCK', 'DAMAGED') NOT NULL DEFAULT 'RESTOCK',
    `saleReturnId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_return_items_saleReturnId_idx`(`saleReturnId`),
    INDEX `sale_return_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(191) NOT NULL,
    `quotationNo` VARCHAR(191) NOT NULL,
    `quotationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `grandTotal` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'CONVERTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `quotations_shopId_idx`(`shopId`),
    INDEX `quotations_branchId_idx`(`branchId`),
    UNIQUE INDEX `quotations_shopId_quotationNo_key`(`shopId`, `quotationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quotation_items_quotationId_idx`(`quotationId`),
    INDEX `quotation_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'BANK', 'BKASH', 'NAGAD', 'ROCKET', 'OTHER') NOT NULL DEFAULT 'CASH',
    `accountNumber` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `openingBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `currentBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `accounts_shopId_idx`(`shopId`),
    INDEX `accounts_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAW', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'PURCHASE', 'EXPENSE', 'INCOME', 'PAYROLL', 'LOAN') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balanceAfter` DECIMAL(10, 2) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referenceType` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `voucherNo` VARCHAR(191) NULL,
    `trxCode` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `account_transactions_branchId_idx`(`branchId`),
    INDEX `account_transactions_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_cheques` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('RECEIVED', 'ISSUED') NOT NULL DEFAULT 'RECEIVED',
    `partyType` ENUM('CUSTOMER', 'SUPPLIER', 'OTHER') NOT NULL DEFAULT 'CUSTOMER',
    `partyName` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `chequeNumber` VARCHAR(191) NOT NULL,
    `chequeDate` DATETIME(3) NOT NULL,
    `clearingDate` DATETIME(3) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bank_cheques_shopId_idx`(`shopId`),
    INDEX `bank_cheques_branchId_idx`(`branchId`),
    INDEX `bank_cheques_chequeNumber_idx`(`chequeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loans` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TAKEN', 'GIVEN') NOT NULL DEFAULT 'TAKEN',
    `loanNo` VARCHAR(191) NULL,
    `personName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `totalPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `remainingAmount` DECIMAL(10, 2) NOT NULL,
    `loanDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'PAID') NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `loans_shopId_idx`(`shopId`),
    INDEX `loans_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_installments` (
    `id` VARCHAR(191) NOT NULL,
    `voucherNo` VARCHAR(191) NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `loan_installments_branchId_idx`(`branchId`),
    INDEX `loan_installments_loanId_idx`(`loanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expense_categories_shopId_idx`(`shopId`),
    UNIQUE INDEX `expense_categories_shopId_code_key`(`shopId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `voucherNo` VARCHAR(191) NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `receiptImage` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expenses_shopId_idx`(`shopId`),
    INDEX `expenses_branchId_idx`(`branchId`),
    UNIQUE INDEX `expenses_shopId_voucherNo_key`(`shopId`, `voucherNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `other_incomes` (
    `id` VARCHAR(191) NOT NULL,
    `incomeSource` VARCHAR(191) NOT NULL,
    `receiptNo` VARCHAR(191) NOT NULL,
    `incomeDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `other_incomes_shopId_idx`(`shopId`),
    INDEX `other_incomes_branchId_idx`(`branchId`),
    UNIQUE INDEX `other_incomes_shopId_receiptNo_key`(`shopId`, `receiptNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_assets` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `assetCode` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchaseCost` DECIMAL(10, 2) NOT NULL,
    `currentValue` DECIMAL(10, 2) NOT NULL,
    `condition` ENUM('GOOD', 'MAINTENANCE', 'DAMAGED', 'DISPOSED') NOT NULL DEFAULT 'GOOD',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `company_assets_shopId_idx`(`shopId`),
    UNIQUE INDEX `company_assets_shopId_assetCode_key`(`shopId`, `assetCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `owner_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('CAPITAL', 'DRAWING') NOT NULL DEFAULT 'CAPITAL',
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `reference` VARCHAR(191) NULL,
    `purpose` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `owner_transactions_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `departments_shopId_idx`(`shopId`),
    UNIQUE INDEX `departments_shopId_code_key`(`shopId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `nidNumber` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NOT NULL,
    `joiningDate` DATETIME(3) NOT NULL,
    `basicSalary` DECIMAL(10, 2) NOT NULL,
    `dailyAllowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `overtimeRate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `address` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `branchId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_profiles_userId_key`(`userId`),
    INDEX `staff_profiles_shopId_idx`(`shopId`),
    INDEX `staff_profiles_branchId_idx`(`branchId`),
    UNIQUE INDEX `staff_profiles_shopId_phone_key`(`shopId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_advances` (
    `id` VARCHAR(191) NOT NULL,
    `advanceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `purpose` VARCHAR(191) NULL,
    `isDeducted` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_advances_branchId_idx`(`branchId`),
    INDEX `salary_advances_staffId_idx`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
    `payslipNo` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `salaryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `basicSalary` DECIMAL(10, 2) NOT NULL,
    `allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `overtimeAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `advanceDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `penaltyDeduction` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `netSalary` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'paid',
    `notes` TEXT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payrolls_branchId_idx`(`branchId`),
    INDEX `payrolls_staffId_idx`(`staffId`),
    UNIQUE INDEX `payrolls_shopId_payslipNo_key`(`shopId`, `payslipNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_registers` (
    `id` VARCHAR(191) NOT NULL,
    `closingDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `openingTime` VARCHAR(191) NOT NULL DEFAULT '08:00:00',
    `closingTime` VARCHAR(191) NULL,
    `openingCash` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashSales` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashDueCollected` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashOtherIncome` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashExpenses` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashSupplierPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cashRefunds` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `expectedCash` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `countedCash` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `difference` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalInvoices` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'closed',
    `branchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cash_registers_shopId_idx`(`shopId`),
    INDEX `cash_registers_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `relationship` ENUM('FATHER', 'UNCLE', 'BROTHER', 'SELF', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `phone` VARCHAR(191) NULL,
    `nidNumber` VARCHAR(191) NULL,
    `equityPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `openingCapital` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `currentBalance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `monthlyAllowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `partners_shopId_idx`(`shopId`),
    UNIQUE INDEX `partners_shopId_name_key`(`shopId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `voucherNo` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH_DRAWING', 'BANK_DRAWING', 'CAPITAL_INJECTION', 'HOUSEHOLD_EXPENSE', 'PROFIT_DISTRIBUTION') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'cash',
    `purpose` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partner_transactions_partnerId_idx`(`partnerId`),
    INDEX `partner_transactions_branchId_idx`(`branchId`),
    INDEX `partner_transactions_accountId_idx`(`accountId`),
    UNIQUE INDEX `partner_transactions_shopId_voucherNo_key`(`shopId`, `voucherNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_rations` (
    `id` VARCHAR(191) NOT NULL,
    `rationNo` VARCHAR(191) NOT NULL,
    `rationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalCost` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partner_rations_partnerId_idx`(`partnerId`),
    INDEX `partner_rations_branchId_idx`(`branchId`),
    UNIQUE INDEX `partner_rations_shopId_rationNo_key`(`shopId`, `rationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_ration_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `rationId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partner_ration_items_rationId_idx`(`rationId`),
    INDEX `partner_ration_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limit_buckets` (
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `resetAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rate_limit_buckets_resetAt_idx`(`resetAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_baseUnitId_fkey` FOREIGN KEY (`baseUnitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_sections` ADD CONSTRAINT `product_sections_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brands` ADD CONSTRAINT `brands_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `product_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_stocks` ADD CONSTRAINT `product_stocks_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_stocks` ADD CONSTRAINT `product_stocks_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_wastages` ADD CONSTRAINT `stock_wastages_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_wastages` ADD CONSTRAINT `stock_wastages_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_wastage_items` ADD CONSTRAINT `stock_wastage_items_wastageId_fkey` FOREIGN KEY (`wastageId`) REFERENCES `stock_wastages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_wastage_items` ADD CONSTRAINT `stock_wastage_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transfers` ADD CONSTRAINT `stock_transfers_fromBranchId_fkey` FOREIGN KEY (`fromBranchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transfers` ADD CONSTRAINT `stock_transfers_toBranchId_fkey` FOREIGN KEY (`toBranchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transfers` ADD CONSTRAINT `stock_transfers_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transfer_items` ADD CONSTRAINT `stock_transfer_items_transferId_fkey` FOREIGN KEY (`transferId`) REFERENCES `stock_transfers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transfer_items` ADD CONSTRAINT `stock_transfer_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_returnId_fkey` FOREIGN KEY (`returnId`) REFERENCES `purchase_returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_payments` ADD CONSTRAINT `customer_payments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_payments` ADD CONSTRAINT `customer_payments_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_payments` ADD CONSTRAINT `customer_payments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_returns` ADD CONSTRAINT `sale_returns_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_returns` ADD CONSTRAINT `sale_returns_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_returns` ADD CONSTRAINT `sale_returns_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_returns` ADD CONSTRAINT `sale_returns_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_returns` ADD CONSTRAINT `sale_returns_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_return_items` ADD CONSTRAINT `sale_return_items_saleReturnId_fkey` FOREIGN KEY (`saleReturnId`) REFERENCES `sale_returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_return_items` ADD CONSTRAINT `sale_return_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_return_items` ADD CONSTRAINT `sale_return_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transactions` ADD CONSTRAINT `account_transactions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transactions` ADD CONSTRAINT `account_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transactions` ADD CONSTRAINT `account_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_cheques` ADD CONSTRAINT `bank_cheques_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_cheques` ADD CONSTRAINT `bank_cheques_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_cheques` ADD CONSTRAINT `bank_cheques_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_cheques` ADD CONSTRAINT `bank_cheques_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_installments` ADD CONSTRAINT `loan_installments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_installments` ADD CONSTRAINT `loan_installments_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_installments` ADD CONSTRAINT `loan_installments_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_installments` ADD CONSTRAINT `loan_installments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `other_incomes` ADD CONSTRAINT `other_incomes_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `other_incomes` ADD CONSTRAINT `other_incomes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `other_incomes` ADD CONSTRAINT `other_incomes_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_assets` ADD CONSTRAINT `company_assets_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_assets` ADD CONSTRAINT `company_assets_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_transactions` ADD CONSTRAINT `owner_transactions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owner_transactions` ADD CONSTRAINT `owner_transactions_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_advances` ADD CONSTRAINT `salary_advances_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_advances` ADD CONSTRAINT `salary_advances_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_advances` ADD CONSTRAINT `salary_advances_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partners` ADD CONSTRAINT `partners_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_transactions` ADD CONSTRAINT `partner_transactions_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_transactions` ADD CONSTRAINT `partner_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_transactions` ADD CONSTRAINT `partner_transactions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_transactions` ADD CONSTRAINT `partner_transactions_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_rations` ADD CONSTRAINT `partner_rations_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_rations` ADD CONSTRAINT `partner_rations_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_rations` ADD CONSTRAINT `partner_rations_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_ration_items` ADD CONSTRAINT `partner_ration_items_rationId_fkey` FOREIGN KEY (`rationId`) REFERENCES `partner_rations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_ration_items` ADD CONSTRAINT `partner_ration_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_ration_items` ADD CONSTRAINT `partner_ration_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
