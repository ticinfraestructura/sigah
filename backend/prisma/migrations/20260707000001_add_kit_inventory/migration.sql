-- CreateTable
CREATE TABLE "kit_inventory" (
    "id" UUID NOT NULL,
    "kitId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kit_inventory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kit_inventory_kitId_key" UNIQUE ("kitId")
);

-- CreateTable
CREATE TABLE "kit_inventory_movements" (
    "id" UUID NOT NULL,
    "kitInventoryId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lotNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "reason" TEXT,
    "reference" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kit_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kit_inventory" ADD CONSTRAINT "kit_inventory_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_inventory_movements" ADD CONSTRAINT "kit_inventory_movements_kitInventoryId_fkey" FOREIGN KEY ("kitInventoryId") REFERENCES "kit_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_inventory_movements" ADD CONSTRAINT "kit_inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
