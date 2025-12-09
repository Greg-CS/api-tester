"use server";

import { PrismaClient } from "../../prisma/generated/prisma/client";

// Use Prisma Accelerate - the DATABASE_URL should be your accelerate URL
const prisma = process.env.DATABASE_URL 
  ? new PrismaClient({ accelerateUrl: process.env.DATABASE_URL })
  : null;

export interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getRequests(): Promise<ActionResult<SavedRequest[]>> {
  if (!prisma) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const requests = await prisma.savedRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: requests };
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function createRequest(data: {
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
}): Promise<ActionResult<SavedRequest>> {
  if (!prisma) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const savedRequest = await prisma.savedRequest.create({
      data: {
        name: data.name,
        url: data.url,
        method: data.method,
        headers: data.headers || "",
        body: data.body || "",
      },
    });
    return { success: true, data: savedRequest };
  } catch (error) {
    console.error("Failed to create request:", error);
    const message = error instanceof Error ? error.message : "Failed to create request";
    return { success: false, error: message };
  }
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  if (!prisma) {
    return { success: false, error: "Database not configured" };
  }

  if (!id) {
    return { success: false, error: "ID required" };
  }

  try {
    await prisma.savedRequest.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete request:", error);
    return { success: false, error: "Failed to delete request" };
  }
}
