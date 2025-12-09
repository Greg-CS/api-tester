import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET all saved requests
export async function GET() {
  try {
    const requests = await prisma.savedRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST create a new request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, method, headers, body: requestBody } = body;

    const savedRequest = await prisma.savedRequest.create({
      data: {
        name,
        url,
        method,
        headers: headers || "",
        body: requestBody || "",
      },
    });

    return NextResponse.json(savedRequest);
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

// DELETE a request by id (passed as query param)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.savedRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete request:", error);
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
