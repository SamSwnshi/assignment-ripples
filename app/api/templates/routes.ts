import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Template from '../models/Template';
import { authMiddleware } from '@/app/api/middleware/auth';

// GET /api/templates - Get all templates
export async function GET(request: Request) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    await connectDB();
    const templates = await Template.find().sort({ usageCount: -1 });
    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template (admin only)
export async function POST(request: Request) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get user ID from headers (set by middleware)
    const userId = (request as any).headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const data = await request.json();

    const template = new Template({
      ...data,
      createdBy: userId
    });
    await template.save();

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 