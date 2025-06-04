import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export async function authMiddleware(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    console.log('Token decoded successfully, userId:', decoded.userId);

    // Create a new response that will forward the request
    const response = NextResponse.next();
    
    // Set the user ID in the response headers
    response.headers.set('x-user-id', decoded.userId);

    return response;
  } catch (error: unknown) {
    console.error('Auth middleware error:', error);
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 