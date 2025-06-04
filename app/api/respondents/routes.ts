import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Respondent from '@/app/api/models/Respondent';
import Response from '@/app/api/models/Response';
import { authMiddleware } from '@/app/api/middleware/auth';
import { NextRequest } from 'next/server';

// GET /api/respondents - Get list of respondents
export async function GET(request: NextRequest) {
  try {
    // Apply auth middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Connect to database
    await connectDB();

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Get total count
    const total = await Respondent.countDocuments(searchQuery);

    // Get respondents with pagination
    const respondents = await Respondent.find(searchQuery)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get response counts and last response for each respondent
    const respondentsWithStats = await Promise.all(
      respondents.map(async (respondent) => {
        const responses = await Response.find({ respondentId: respondent._id })
          .sort({ completedAt: -1 })
          .limit(1);

        const lastResponse = responses[0];
        const responseCount = await Response.countDocuments({
          respondentId: respondent._id,
        });

        return {
          id: respondent._id,
          name: respondent.name,
          email: respondent.email,
          surveys: responseCount,
          lastActive: lastResponse ? lastResponse.completedAt : respondent.updatedAt,
          metadata: respondent.metadata,
          createdAt: respondent.createdAt,
          updatedAt: respondent.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        respondents: respondentsWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error: any) {
    console.error('Get respondents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 