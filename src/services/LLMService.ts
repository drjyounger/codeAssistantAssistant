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

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = process.env.REACT_APP_GEMINI_URL;

export const generateCodeReview = async (
  request: ReviewRequest
): Promise<ApiResponse<ReviewResponse>> => {
  try {
    const systemPrompt = generateSystemPrompt({
      jiraTicket: request.jiraTicket,
      githubPR: request.githubPR,
      concatenatedFiles: request.concatenatedFiles,
      additionalFiles: request.referenceFiles
    });

    const response = await fetch(GEMINI_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DEROGATORY",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    const data = await response.json();
    
    return {
      success: true,
      data: {
        review: data.candidates[0].content.parts[0].text,
        suggestions: [], // Parse suggestions from the response
        score: 0 // Calculate score if needed
      }
    };
  } catch (error) {
    console.error('Error generating review:', error);
    return {
      success: false,
      error: 'Failed to generate code review'
    };
  }
};
