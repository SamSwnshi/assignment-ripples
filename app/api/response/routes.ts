import { NextResponse } from 'next/server';
import connectDB from '@/app/api/lib/mongodb';
import Survey from '@/app/api/models/Survey';
import Response from '@/app/api/models/Response';
import Respondent from '@/app/api/models/Respondent';

// POST /api/responses - Submit survey response
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyId, respondent, answers } = body;

    // Validate required fields
    if (!surveyId || !answers) {
      return NextResponse.json(
        { error: 'Survey ID and answers are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find survey
    const survey = await Survey.findById(surveyId);
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
          { error: `Question "${question.question}" is required` },
          { status: 400 }
        );
      }

      // Validate answer based on question type
      if (answer) {
        switch (question.type) {
          case 'single-choice':
            if (!question.options.includes(answer)) {
              return NextResponse.json(
                { error: `Invalid answer for question "${question.question}"` },
                { status: 400 }
              );
            }
            break;
          case 'multiple-choice':
            if (!Array.isArray(answer) || !answer.every(a => question.options.includes(a))) {
              return NextResponse.json(
                { error: `Invalid answer for question "${question.question}"` },
                { status: 400 }
              );
            }
            break;
          case 'rating':
          case 'nps':
            if (isNaN(answer) || answer < 0 || answer > (question.type === 'nps' ? 10 : 5)) {
              return NextResponse.json(
                { error: `Invalid rating for question "${question.question}"` },
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
      surveyId,
      respondentId: respondentDoc._id,
      answers: validatedAnswers,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    // Update survey responses count
    await Survey.findByIdAndUpdate(surveyId, {
      $inc: { responsesCount: 1 },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Response submitted successfully',
        data: { response },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 