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

interface OptionCounts {
  [key: string]: number;
}

// GET /api/surveys/[id]/analytics - Get survey analytics
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

    // Get total responses
    const totalResponses = await Response.countDocuments({ surveyId: id });

    // Get response completion rate
    const completionRate = totalResponses > 0 ? 100 : 0;

    // Get response distribution by question
    const questionAnalytics = await Promise.all(
      survey.questions.map(async (question: Question) => {
        const responses = await Response.find({ surveyId: id });
        const answers = responses.map((response) => response.answers.get(question.id));

        let analytics: any = {
          questionId: question.id,
          question: question.question,
          type: question.type,
          totalResponses: answers.filter(Boolean).length,
        };

        switch (question.type) {
          case 'single-choice':
          case 'multiple-choice':
            const optionCounts: OptionCounts = {};
            question.options.forEach((option: string) => {
              optionCounts[option] = answers.filter((answer) => {
                if (question.type === 'single-choice') {
                  return answer === option;
                }
                return Array.isArray(answer) && answer.includes(option);
              }).length;
            });
            analytics.optionDistribution = optionCounts;
            break;

          case 'rating':
          case 'nps':
            const validAnswers = answers.filter((answer) => typeof answer === 'number');
            if (validAnswers.length > 0) {
              analytics.average = validAnswers.reduce((a, b) => a + b, 0) / validAnswers.length;
              analytics.min = Math.min(...validAnswers);
              analytics.max = Math.max(...validAnswers);
            }
            break;
        }

        return analytics;
      })
    );

    // Get response timeline
    const timeline = await Response.aggregate([
      { $match: { surveyId: id } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        surveyId: id,
        totalResponses,
        completionRate,
        questionAnalytics,
        timeline,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 