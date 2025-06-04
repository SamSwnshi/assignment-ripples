import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Template from '@/app/api/models/Template';
import { authMiddleware } from '@/app/api/middleware/auth';

// POST /api/templates/[id]/use - Use a template and increment usage count
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    await connectDB();

    // Find and update template
    const template = await Template.findOneAndUpdate(
      { id: params.id },
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error('Error using template:', error);
    return NextResponse.json(
      { error: 'Failed to use template' },
      { status: 500 }
    );
  }
} 