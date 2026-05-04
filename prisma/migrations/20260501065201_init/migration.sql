-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "tutorial_guide" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoAlert" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "previous_price" DOUBLE PRECISION NOT NULL,
    "current_price" DOUBLE PRECISION NOT NULL,
    "change_percent" DOUBLE PRECISION NOT NULL,
    "alert_type" TEXT NOT NULL DEFAULT 'CRASH',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Watchlist_user_id_idx" ON "Watchlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_user_id_asset_id_key" ON "Watchlist"("user_id", "asset_id");

-- CreateIndex
CREATE INDEX "CryptoAlert_asset_id_detected_at_idx" ON "CryptoAlert"("asset_id", "detected_at");

-- CreateIndex
CREATE INDEX "CryptoAlert_detected_at_idx" ON "CryptoAlert"("detected_at");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
