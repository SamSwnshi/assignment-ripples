import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Survey from '@/app/api/models/Survey';
import { authMiddleware } from '@/app/api/middleware/auth';

// PUT /api/surveys/[id]/unpublish - Unpublish survey
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const userId = (request as any).headers.get('x-user-id');
    const { id } = params;

    // Connect to database
    await connectDB();

    // Find and update survey
    const survey = await Survey.findOneAndUpdate(
      { _id: id, userId },
      {
        status: 'draft',
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Survey unpublished successfully',
      data: { survey },
    });
  } catch (error: any) {
    console.error('Unpublish survey error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 