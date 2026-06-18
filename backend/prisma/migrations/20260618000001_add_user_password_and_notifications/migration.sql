-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "whatsappApiKey" TEXT;
ALTER TABLE "users" ADD COLUMN "telegramChatId" TEXT;
