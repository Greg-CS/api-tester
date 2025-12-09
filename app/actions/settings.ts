"use server";

import { prisma } from "@/lib/db";

export interface AppSettings {
  id: string;
  useDatabase: boolean;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getSettings(): Promise<ActionResult<AppSettings>> {
  if (!prisma) {
    return { success: false, error: "Database not configured" };
  }

  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "default", useDatabase: true },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSettings(useDatabase: boolean): Promise<ActionResult<AppSettings>> {
  if (!prisma) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: { useDatabase },
      create: { id: "default", useDatabase },
    });

    return { success: true, data: settings };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
