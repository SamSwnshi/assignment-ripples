const API_BASE_URL = '/api'

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: any[]
  status: 'draft' | 'active' | 'closed' | 'archived'
  responsesCount?: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  settings?: {
    isPublic: boolean
    allowMultipleResponses: boolean
    endDate?: string
    responseLimit?: number
  }
}

export interface Respondent {
  id: string
  name: string
  email: string
  responses: any[]
  lastResponseAt: string
}

export interface SurveyResponse {
  id: string
  surveyId: string
  answers: any[]
  submittedAt: string
}

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json()

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }

      throw new Error(data.error || 'An error occurred')
    }

    return data
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    return this.handleResponse<AuthResponse>(response)
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    })
    return this.handleResponse<AuthResponse>(response)
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<void>(response)
  }

  // Survey endpoints
  async getSurveys(): Promise<ApiResponse<Survey[]>> {
    const response = await fetch(`${API_BASE_URL}/surveys`, {
      headers: this.getAuthHeaders()
    })
    const data = await this.handleResponse<{ surveys: Survey[] }>(response)
    return {
      success: data.success,
      data: data.data.surveys
    }
  }

  async createSurvey(surveyData: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responsesCount'>): Promise<ApiResponse<Survey>> {
    const response = await fetch(`${API_BASE_URL}/surveys`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(surveyData)
    })
    return this.handleResponse<Survey>(response)
  }

  async updateSurvey(id: string, surveyData: Partial<Survey>): Promise<ApiResponse<Survey>> {
    const response = await fetch(`${API_BASE_URL}/surveys/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(surveyData)
    })
    return this.handleResponse<Survey>(response)
  }

  async deleteSurvey(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/surveys/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<void>(response)
  }

  async publishSurvey(id: string): Promise<ApiResponse<Survey>> {
    const response = await fetch(`${API_BASE_URL}/surveys/${id}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<Survey>(response)
  }

  // Respondent endpoints
  async getRespondents(): Promise<ApiResponse<Respondent[]>> {
    const response = await fetch(`${API_BASE_URL}/respondents`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<Respondent[]>(response)
  }

  async getRespondentAnalytics(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/respondents/analytics`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<any>(response)
  }

  // Response endpoints
  async submitResponse(surveyId: string, responseData: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<ApiResponse<SurveyResponse>> {
    const response = await fetch(`${API_BASE_URL}/surveys/${surveyId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    })
    return this.handleResponse<SurveyResponse>(response)
  }

  async getSurveyResponses(surveyId: string): Promise<ApiResponse<SurveyResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/surveys/${surveyId}/responses`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<SurveyResponse[]>(response)
  }
}

export const apiClient = new ApiClient() 