const { generateSystemPrompt } = require('../prompts/systemPrompt.ts');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent";
const GEMINI_FILE_UPLOAD_URL = "https://generativelanguage.googleapis.com/upload/v1beta/files";

const GEMINI_CONFIG = {
  temperature: 0.7,
  candidateCount: 1,
  // Explicitly NOT setting maxOutputTokens to allow Gemini to use its maximum context window
  // Gemini-2.0-pro-exp-02-05 has a large context window when maxOutputTokens is not specified
};

// Maximum prompt size (in tokens) to allow some headroom in the 2M context window
const MAX_PROMPT_TOKENS = 1800000;

// Helper function to upload file to Gemini
const uploadFileToGemini = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath);
    const formData = new FormData();
    
    // Get file information
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    
    // Determine MIME type based on extension
    let mimeType;
    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.png') {
      mimeType = 'image/png';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    } else {
      mimeType = 'application/octet-stream';
    }
    
    // Add file to form data
    formData.append('file', fileContent, {
      filename: fileName,
      contentType: mimeType
    });
    
    // Upload to Gemini
    const response = await axios.post(
      `${GEMINI_FILE_UPLOAD_URL}?key=${GEMINI_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    
    // Return file metadata from response
    return response.data.file;
  } catch (error) {
    console.error('Error uploading file to Gemini:', error);
    throw error;
  }
};

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

const makeRequest = async (promptString, imageFiles = [], retryCount = 0) => {
  try {
    // Check if API key is present
    if (!GEMINI_API_KEY) {
      console.error('[DEBUG] API key is missing. Check your .env file and ensure REACT_APP_GEMINI_API_KEY is set.');
      throw new Error('Gemini API key is missing');
    }

    console.log(`[DEBUG] Request URL: ${GEMINI_API_URL}?key=xxxxx... (key length: ${GEMINI_API_KEY ? GEMINI_API_KEY.length : 0})`);
    
    let requestBody;
    
    // If we have image files, construct a multimodal request
    if (imageFiles && imageFiles.length > 0) {
      console.log(`[DEBUG] Preparing multimodal request with ${imageFiles.length} images`);
      
      // Create the contents array with text and image files
      const contents = [];
      
      // Add the system prompt as text
      contents.push({
        parts: [{
          text: promptString
        }]
      });
      
      // Add each image file as a separate part
      for (const imageFile of imageFiles) {
        contents.push({
          parts: [{
            file_data: {
              file_uri: imageFile.uri,
              mime_type: imageFile.mimeType
            }
          }]
        });
      }
      
      requestBody = {
        contents,
        generationConfig: {
          ...GEMINI_CONFIG,
          temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
        }
      };
    } else {
      // Standard text-only request
      requestBody = {
        contents: [{
          parts: [{
            text: promptString
          }]
        }],
        generationConfig: {
          ...GEMINI_CONFIG,
          temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
        }
      };
    }
    
    console.log(`[DEBUG] Request body structure:`, JSON.stringify({
      ...requestBody,
      contents: requestBody.contents.map(content => ({
        parts: content.parts.map(part => {
          if (part.text) {
            return { text: part.text.substring(0, 200) + '...[truncated]' };
          } else if (part.file_data) {
            return { file_data: { file_uri: part.file_data.file_uri, mime_type: part.file_data.mime_type } };
          }
          return part;
        })
      }))
    }, null, 2));

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
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

const generateCodeReview = async ({ jiraTickets = [], concatenatedFiles = '', referenceFiles = [], uploadedImages = [] }) => {
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
    
    if (!Array.isArray(uploadedImages)) {
      console.warn('Warning: uploadedImages is not an array, converting to array');
      uploadedImages = uploadedImages ? [uploadedImages] : [];
    }

    console.log(`- Number of Jira tickets: ${jiraTickets.length}`);
    console.log(`- Concatenated files size: ${concatenatedFiles.length} characters`);
    console.log(`- Reference files included: ${referenceFiles.length}`);
    console.log(`- Image files included: ${uploadedImages.length}`);
    console.log('-------------------------------------');

    // Upload image files to Gemini if needed
    let geminiImageFiles = [];
    if (uploadedImages.length > 0) {
      console.log(`🖼️ Uploading ${uploadedImages.length} image files to Gemini API...`);
      
      // Get the uploads directory path
      const uploadsDir = path.join(__dirname, '../../temp-uploads');
      
      try {
        for (const image of uploadedImages) {
          // Find the file in the uploads directory
          const files = await fs.readdir(uploadsDir);
          const imageFile = files.find(file => file.startsWith(image.id));
          
          if (imageFile) {
            const filePath = path.join(uploadsDir, imageFile);
            console.log(`- Uploading image: ${image.name} (${filePath})`);
            
            // Upload file to Gemini
            const geminiFile = await uploadFileToGemini(filePath);
            console.log(`  ✅ Uploaded to Gemini: ${geminiFile.name}`);
            
            // Save the file data
            geminiImageFiles.push(geminiFile);
          } else {
            console.warn(`⚠️ Image file not found for ID: ${image.id}`);
          }
        }
        
        console.log(`✅ Successfully uploaded ${geminiImageFiles.length} of ${uploadedImages.length} images to Gemini API`);
      } catch (error) {
        console.error('❌ Error uploading images to Gemini:', error);
        throw new Error(`Failed to upload images to Gemini: ${error.message}`);
      }
    }

    console.log('🚀 Preparing LLM API call...');
    let promptString = generateSystemPrompt({
      jiraTickets,
      concatenatedFiles,
      referenceFiles,
      designImages: uploadedImages
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
    console.log(`- Images: ${geminiImageFiles.length}`);

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
        console.log(`- Images: ${geminiImageFiles.length}`);
        console.log(`- Timestamp: ${new Date().toISOString()}`);
        
        generatedText = await makeRequest(promptString, geminiImageFiles, attempt);
        
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

    // Clean up Gemini image files
    if (geminiImageFiles.length > 0) {
      console.log('🧹 Cleaning up Gemini image files...');
      // Note: In a production environment, add code here to delete the files from Gemini API
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
