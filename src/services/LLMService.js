const { generateSystemPrompt } = require('../prompts/systemPrompt');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent";

const GEMINI_CONFIG = {
  temperature: 0.7,
  candidateCount: 1,
  // Explicitly NOT setting maxOutputTokens to allow Gemini to use its maximum context window
  // Gemini-2.0-pro-exp-02-05 has a large context window when maxOutputTokens is not specified
};

// Maximum prompt size (in tokens) to allow some headroom in the 2M context window
const MAX_PROMPT_TOKENS = 1800000;

const validateResponse = (text) => {
  const sections = {
    'Summary': text.includes('1. SUMMARY'),
    'Affected Files': text.includes('2. AFFECTED FILES'),
    'Instruction Guide': text.includes('3. A HIGHLY DETAILED INSTRUCTION GUIDE'),
    'Changes Breakdown': text.includes('4. DETAILED BREAKDOWN OF RECOMMENDED CHANGES')
  };

  console.log('📑 Section Verification:');
  Object.entries(sections).forEach(([section, present]) => {
    console.log(`- ${section}: ${present ? '✅' : '❌'}`);
  });

  return !Object.values(sections).some(present => !present);
};

const makeRequest = async (promptString, retryCount = 0) => {
  try {
    // Check if API key is present
    if (!GEMINI_API_KEY) {
      console.error('[DEBUG] API key is missing. Check your .env file and ensure REACT_APP_GEMINI_API_KEY is set.');
      throw new Error('Gemini API key is missing');
    }

    console.log(`[DEBUG] Request URL: ${GEMINI_API_URL}?key=xxxxx... (key length: ${GEMINI_API_KEY ? GEMINI_API_KEY.length : 0})`);
    console.log(`[DEBUG] Request body:`, JSON.stringify({
      contents: [{
        parts: [{
          text: promptString.substring(0, 200) + '...[truncated]'
        }]
      }],
      generationConfig: {
        ...GEMINI_CONFIG,
        temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
      }
    }, null, 2));

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
          ...GEMINI_CONFIG,
          // On retry, reduce temperature for more focused output
          temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[DEBUG] API Error Response (${response.status}):`, errorData);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('[DEBUG] Unexpected response format:', JSON.stringify(result, null, 2));
      throw new Error('Unexpected response format from Gemini API');
    }

    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('[DEBUG] Request failed:', error.message);
    throw error;
  }
};

const generateCodeReview = async ({ jiraTickets = [], concatenatedFiles = '', referenceFiles = [] }) => {
  const startTime = Date.now();
  try {
    // Extract model name from the API URL
    const modelNameMatch = GEMINI_API_URL.match(/models\/([^:]+)/);
    const modelName = modelNameMatch ? modelNameMatch[1] : 'unknown-model';
    
    console.log('\n🔍 Starting Code Review Generation');
    console.log('=====================================');
    console.log('📋 Input Summary:');
    
    // Validate inputs
    if (!Array.isArray(jiraTickets)) {
      console.warn('Warning: jiraTickets is not an array, converting to array');
      jiraTickets = jiraTickets ? [jiraTickets] : [];
    }
    
    if (typeof concatenatedFiles !== 'string') {
      console.warn('Warning: concatenatedFiles is not a string, converting to string');
      concatenatedFiles = String(concatenatedFiles || '');
    }
    
    if (!Array.isArray(referenceFiles)) {
      console.warn('Warning: referenceFiles is not an array, converting to array');
      referenceFiles = referenceFiles ? [referenceFiles] : [];
    }

    console.log(`- Number of Jira tickets: ${jiraTickets.length}`);
    console.log(`- Concatenated files size: ${concatenatedFiles.length} characters`);
    console.log(`- Reference files included: ${referenceFiles.length}`);
    console.log('-------------------------------------');

    console.log('🚀 Preparing LLM API call...');
    let promptString = generateSystemPrompt({
      jiraTickets,
      concatenatedFiles,
      referenceFiles,
    });

    // Add explicit section requirements
    promptString = `${promptString}

IMPORTANT: Your response MUST include these exact section headers in this order:
1. SUMMARY
2. AFFECTED FILES
3. A HIGHLY DETAILED INSTRUCTION GUIDE
4. DETAILED BREAKDOWN OF RECOMMENDED CHANGES

Each section is required and must maintain this exact naming. Do not skip any sections.`;

    const estimatedTokens = Math.round(promptString.length / 4);
    console.log(`📝 Generated prompt details:`);
    console.log(`- Total length: ${promptString.length} characters`);
    console.log(`- Estimated tokens: ~${estimatedTokens}`);

    if (estimatedTokens > MAX_PROMPT_TOKENS) {
      throw new Error(`Prompt too large (${estimatedTokens} tokens). Maximum allowed is ${MAX_PROMPT_TOKENS} tokens.`);
    }

    console.log('-------------------------------------');

    // Try up to 3 times with different configurations
    let generatedText;
    let success = false;
    let lastError;

    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        console.log(`📡 Sending request to Gemini API (attempt ${attempt + 1}/3)...`);
        console.log(`- Model: ${modelName}`);
        console.log(`- Temperature: ${attempt > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * attempt)) : GEMINI_CONFIG.temperature}`);
        console.log(`- Timestamp: ${new Date().toISOString()}`);
        
        generatedText = await makeRequest(promptString, attempt);
        
        console.log('-------------------------------------');
        console.log('📊 Generation Results:');
        console.log(`- Response length: ${generatedText.length} characters`);
        console.log(`- Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

        // Validate response has all required sections
        if (validateResponse(generatedText)) {
          success = true;
          break;
        } else {
          console.log(`❌ Attempt ${attempt + 1} failed: Missing required sections`);
          if (attempt < 2) {
            console.log('🔄 Retrying with adjusted parameters...\n');
          }
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < 2) {
          console.log('🔄 Retrying...\n');
        }
      }
    }

    if (!success) {
      throw lastError || new Error('Failed to generate valid review after 3 attempts');
    }

    console.log('=====================================');
    console.log('✅ Code Review Generation Complete!\n');

    return {
      success: true,
      data: generatedText
    };
  } catch (error) {
    console.error('\n❌ Error in Code Review Generation');
    console.error('=====================================');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timeTaken: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
    console.error('=====================================\n');
    
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : 'Failed to generate review'
    };
  }
};

module.exports = {
  generateCodeReview
};
