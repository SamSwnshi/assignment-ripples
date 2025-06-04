import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Survey from '@/app/api/models/Survey';
import Response from '@/app/api/models/Response';
import { authMiddleware } from '@/app/api/middleware/auth';

interface Question {
  id: string;
  type: 'short-text' | 'long-text' | 'single-choice' | 'multiple-choice' | 'rating' | 'nps';
  question: string;
  options: string[];
  required: boolean;
}

// GET /api/surveys/[id]/responses/export - Export survey responses
export async function GET(
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

    // Check if survey exists and belongs to user
    const survey = await Survey.findOne({ _id: id, userId });
    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    // Get all responses
    const responses = await Response.find({ surveyId: id })
      .populate('respondentId', 'email name')
      .sort({ completedAt: 1 });

    // Generate CSV headers
    const headers = [
      'Response ID',
      'Completed At',
      'Respondent Email',
      'Respondent Name',
      ...survey.questions.map((q: Question) => q.question),
    ];

    // Generate CSV rows
    const rows = responses.map((response) => {
      const row = [
        response._id,
        response.completedAt.toISOString(),
        response.respondentId?.email || '',
        response.respondentId?.name || '',
      ];

      // Add answers for each question
      survey.questions.forEach((question: Question) => {
        const answer = response.answers.get(question.id);
        row.push(
          Array.isArray(answer)
            ? answer.join('; ')
            : answer?.toString() || ''
        );
      });

      return row;
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create response with CSV file
    const response = new NextResponse(csvContent);
    response.headers.set(
      'Content-Type',
      'text/csv; charset=utf-8'
    );
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="survey-${id}-responses.csv"`
    );

    return response;
  } catch (error: any) {
    console.error('Export responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 