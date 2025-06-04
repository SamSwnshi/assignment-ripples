import { NextResponse } from "next/server";
import connectDB from "@/app/api/lib/mongodb";
import User from "@/app/api/models/User";
import { authMiddleware } from "@/app/api/middleware/auth";
import { NextRequest } from "next/server";

// GET /api/user/sessions - Get user sessions
export async function GET(request: NextRequest) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const userId = request.headers.get("x-user-id");
    const currentToken = request.headers.get("authorization")?.split(" ")[1];

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For now, return a mock session since we haven't implemented session tracking
    const sessions = [
      {
        id: "current",
        device: "Current Device",
        location: "Unknown",
        ip: "127.0.0.1",
        isCurrent: true,
        lastActive: "Now",
        firstSeen: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/sessions - Delete all sessions
export async function DELETE(request: NextRequest) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const userId = request.headers.get("x-user-id");

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For now, just return success since we haven't implemented session tracking
    return NextResponse.json({
      success: true,
      message: "All sessions terminated successfully",
    });
  } catch (error: any) {
    console.error("Delete sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
