import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Survey from '@/app/api/models/Survey';
import { authMiddleware } from '@/app/api/middleware/auth';

// GET /api/surveys - List surveys
export async function GET(request: Request) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Get user ID from the auth middleware response
    const userId = authResponse.headers.get('x-user-id');
    if (!userId) {
      console.log('User ID not found in request headers');
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Get query parameters
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Connect to database
    await connectDB();

    // Build query
    const query: any = { userId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Survey.countDocuments(query);

    // Get surveys with pagination
    const surveys = await Survey.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        surveys: surveys.map(survey => ({
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          questions: survey.questions,
          responsesCount: survey.responsesCount,
          createdAt: survey.createdAt,
          updatedAt: survey.updatedAt,
          publishedAt: survey.publishedAt
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error: any) {
    console.error('List surveys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/surveys - Create survey
export async function POST(request: Request) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request as any);
    if (authResponse.status !== 200) {
      console.log('Auth middleware failed:', authResponse.status);
      return authResponse;
    }

    // Get user ID from the auth middleware response
    const userId = authResponse.headers.get('x-user-id');
    if (!userId) {
      console.log('User ID not found in request headers');
      return NextResponse.json(
        { error: 'User ID not found in request' },
        { status: 401 }
      );
    }

    console.log('Creating survey for user:', userId);
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.title) {
      console.log('Validation error: Title is missing');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate questions array
    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      console.log('Validation error: Questions array is invalid or empty');
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate each question
    for (const question of body.questions) {
      console.log('Validating question:', JSON.stringify(question, null, 2));
      
      if (!question.id || !question.type || !question.question) {
        console.log('Validation error: Question missing required fields');
        return NextResponse.json(
          { error: 'Each question must have an id, type, and question text' },
          { status: 400 }
        );
      }

      // Validate question type
      const validTypes = ['short-text', 'long-text', 'single-choice', 'multiple-choice', 'rating', 'nps'];
      if (!validTypes.includes(question.type)) {
        console.log('Validation error: Invalid question type:', question.type);
        return NextResponse.json(
          { error: `Invalid question type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate options for choice questions
      if (['single-choice', 'multiple-choice', 'rating', 'nps'].includes(question.type)) {
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          console.log('Validation error: Choice question missing options');
          return NextResponse.json(
            { error: `Question type ${question.type} requires options` },
            { status: 400 }
          );
        }
      }
    }

    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Create survey
    console.log('Creating survey in database...');
    const survey = await Survey.create({
      ...body,
      userId,
      status: 'draft',
      responsesCount: 0
    });
    console.log('Survey created successfully:', survey._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Survey created successfully',
        data: {
          survey: {
            id: survey._id,
            title: survey.title,
            description: survey.description,
            status: survey.status,
            questions: survey.questions,
            responsesCount: survey.responsesCount,
            createdAt: survey.createdAt,
            updatedAt: survey.updatedAt,
            publishedAt: survey.publishedAt
          }
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create survey error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 