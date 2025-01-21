import { ApiResponse } from '../types';
import { generateSystemPrompt } from '../prompts/systemPrompt';

interface ReviewRequest {
  jiraTicket: any;
  githubPR: any;
  concatenatedFiles: string;
  referenceFiles: string[];
  systemPrompt: string;
}

interface ReviewResponse {
  review: string;
  suggestions: string[];
  score: number;
}

interface CodeReviewParams {
  jiraTicket: any;
  githubPR: any;
  concatenatedFiles: string;
  referenceFiles: string[];
}

interface CodeReviewResponse {
  success: boolean;
  data?: string;
  error?: string;
}

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = process.env.REACT_APP_GEMINI_URL;

export const generateCodeReview = async ({
  jiraTicket,
  githubPR,
  concatenatedFiles,
  referenceFiles
}: CodeReviewParams): Promise<CodeReviewResponse> => {
  try {
    const response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate review: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.review
    };
  } catch (error) {
    console.error('Error generating review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate review'
    };
  }
};
