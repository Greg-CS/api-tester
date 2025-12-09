import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET settings
export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "default", useDatabase: true },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { useDatabase } = body;

    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: { useDatabase },
      create: { id: "default", useDatabase },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
