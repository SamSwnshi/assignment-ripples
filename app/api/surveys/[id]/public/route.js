import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Survey from '@/app/api/models/Survey';
import Response from '@/app/api/models/Response';
import Respondent from '@/app/api/models/Respondent';
import { NextRequest } from 'next/server';

// GET /api/surveys/[id]/public - Get public survey details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Connect to database
    await connectDB();

    // Find survey
    const survey = await Survey.findById(id);
    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    // Check if survey is active
    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'Survey is not active' },
        { status: 400 }
      );
    }

    // Return survey details without sensitive information
    return NextResponse.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          questions: survey.questions,
        }
      }
    });
  } catch (error: any) {
    console.error('Get public survey error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/surveys/[id]/public - Submit public survey response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { respondent, answers } = body;

    // Validate required fields
    if (!answers) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find survey
    const survey = await Survey.findById(id);
    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    // Check if survey is active
    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'Survey is not active' },
        { status: 400 }
      );
    }

    // Create or find respondent
    let respondentDoc;
    if (respondent?.email) {
      respondentDoc = await Respondent.findOneAndUpdate(
        { email: respondent.email },
        { ...respondent, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      respondentDoc = await Respondent.create(respondent || {});
    }

    // Validate answers against survey questions
    const questions = survey.questions;
    const validatedAnswers = new Map();

    for (const question of questions) {
      const answer = answers[question.id];
      
      // Check required questions
      if (question.required && !answer) {
        return NextResponse.json(
          { error: `Answer required for question: ${question.question}` },
          { status: 400 }
        );
      }

      // Validate answer format based on question type
      if (answer) {
        switch (question.type) {
          case 'single-choice':
            if (!question.options.includes(answer)) {
              return NextResponse.json(
                { error: `Invalid answer for question: ${question.question}` },
                { status: 400 }
              );
            }
            break;
          case 'multiple-choice':
            if (!Array.isArray(answer) || !answer.every(a => question.options.includes(a))) {
              return NextResponse.json(
                { error: `Invalid answer for question: ${question.question}` },
                { status: 400 }
              );
            }
            break;
          case 'rating':
            if (typeof answer !== 'number' || answer < 1 || answer > 5) {
              return NextResponse.json(
                { error: `Invalid rating for question: ${question.question}` },
                { status: 400 }
              );
            }
            break;
          case 'nps':
            if (typeof answer !== 'number' || answer < 0 || answer > 10) {
              return NextResponse.json(
                { error: `Invalid NPS score for question: ${question.question}` },
                { status: 400 }
              );
            }
            break;
        }
        validatedAnswers.set(question.id, answer);
      }
    }

    // Create response
    const response = await Response.create({
      surveyId: id,
      respondentId: respondentDoc._id,
      answers: validatedAnswers,
      completedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        response_id: response._id
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Submit response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 