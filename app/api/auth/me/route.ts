import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import User from '@/app/api/models/User';
import { authMiddleware } from '@/app/api/middleware/auth';

export async function GET(request: Request) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get user ID from headers (set by middleware)
    const userId = (request as any).headers.get('x-user-id');

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 