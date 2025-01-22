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
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export const generateCodeReview = async ({
  jiraTicket,
  githubPR,
  concatenatedFiles,
  referenceFiles
}: CodeReviewParams): Promise<CodeReviewResponse> => {
  try {
    const promptString = generateSystemPrompt({
      jiraTicket,
      githubPR,
      concatenatedFiles,
      additionalFiles: referenceFiles,
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptString
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          candidateCount: 1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Unexpected response format from Gemini API');
    }

    const generatedText = result.candidates[0].content.parts[0].text;

    if (!generatedText.includes('1. SUMMARY') || 
        !generatedText.includes('2. CRITICAL ISSUES')) {
      throw new Error('Generated review does not contain the required sections');
    }

    return {
      success: true,
      data: generatedText
    };
  } catch (error) {
    console.error('Error generating review:', error);
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : 'Failed to generate review'
    };
  }
};
