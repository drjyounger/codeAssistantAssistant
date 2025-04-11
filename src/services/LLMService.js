const { generateSystemPrompt } = require('../prompts/systemPrompt');
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
      
      // Create the request with contents array structured with roles
      requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              { text: promptString }
            ]
          }
        ],
        generationConfig: {
          ...GEMINI_CONFIG,
          temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
        }
      };
      
      // Add each image file to the user's parts array
      for (const imageFile of imageFiles) {
        requestBody.contents[0].parts.push({
          file_data: {
            file_uri: imageFile.uri,
            mime_type: imageFile.mime_type
          }
        });
      }
    } else {
      // Standard text-only request
      requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              { text: promptString }
            ]
          }
        ],
        generationConfig: {
          ...GEMINI_CONFIG,
          temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
        }
      };
    }
    
    console.log(`[DEBUG] Request body structure:`, JSON.stringify({
      ...requestBody,
      contents: requestBody.contents.map(content => ({
        role: content.role,
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

const generateCodeReview = async ({ jiraTickets = [], concatenatedFiles = '', referenceFiles = [], uploadedImages = [] /* , uploadedVideos = [] */ }) => {
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
    
    /* Comment out video validation
    if (!Array.isArray(uploadedVideos)) {
      console.warn('Warning: uploadedVideos is not an array, converting to array');
      uploadedVideos = uploadedVideos ? [uploadedVideos] : [];
    }
    */

    console.log(`- Number of Jira tickets: ${jiraTickets.length}`);
    console.log(`- Concatenated files size: ${concatenatedFiles.length} characters`);
    console.log(`- Reference files included: ${referenceFiles.length}`);
    console.log(`- Image files included: ${uploadedImages.length}`);
    // console.log(`- Video files included: ${uploadedVideos?.length || 0}`);
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
            
            // Save the file data with mime_type
            geminiImageFiles.push({
              ...geminiFile,
              mime_type: 'image/jpeg'
            });
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
    
    /* Comment out video upload functionality
    // Upload video files to Gemini if needed
    let geminiVideoFiles = [];
    if (uploadedVideos.length > 0) {
      console.log(`🎬 Uploading ${uploadedVideos.length} video files to Gemini API...`);
      
      // Get the uploads directory path
      const uploadsDir = path.join(__dirname, '../../temp-uploads');
      
      try {
        for (const video of uploadedVideos) {
          // Find the file in the uploads directory
          const files = await fs.readdir(uploadsDir);
          const videoFile = files.find(file => file.startsWith(video.id));
          
          if (videoFile) {
            const filePath = path.join(uploadsDir, videoFile);
            console.log(`- Uploading video: ${video.name} (${filePath})`);
            
            // Upload file to Gemini
            const geminiFile = await uploadFileToGemini(filePath);
            console.log(`  ✅ Uploaded to Gemini: ${geminiFile.name}`);
            
            // Save the file data with mime_type
            geminiVideoFiles.push({
              ...geminiFile,
              mime_type: 'video/mp4'
            });
          } else {
            console.warn(`⚠️ Video file not found for ID: ${video.id}`);
          }
        }
        
        console.log(`✅ Successfully uploaded ${geminiVideoFiles.length} of ${uploadedVideos.length} videos to Gemini API`);
      } catch (error) {
        console.error('❌ Error uploading videos to Gemini:', error);
        throw new Error(`Failed to upload videos to Gemini: ${error.message}`);
      }
    }
    */
    // Initialize an empty array for geminiVideoFiles since we disabled the video upload feature
    const geminiVideoFiles = [];

    console.log('🚀 Preparing LLM API call...');
    let promptString = generateSystemPrompt({
      jiraTickets,
      concatenatedFiles,
      referenceFiles,
      designImages: uploadedImages,
      // uploadedVideos: [] // Pass empty array instead of uploadedVideos
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
    // console.log(`- Videos: ${geminiVideoFiles.length}`);

    if (estimatedTokens > MAX_PROMPT_TOKENS) {
      throw new Error(`Prompt too large (${estimatedTokens} tokens). Maximum allowed is ${MAX_PROMPT_TOKENS} tokens.`);
    }

    console.log('-------------------------------------');

    // Prepare API call payload
    console.log('🤖 Calling Gemini API...');
    console.log(`- Model: ${modelName}`);
    console.log(`- Temperature: ${GEMINI_CONFIG.temperature}`);
    console.log(`- Using ${geminiImageFiles.length} image files and 0 video files`);
    
    // Build the contents array with media files interspersed
    let contents = [];
    
    // Add text first
    contents.push({ text: promptString });
    
    // Add images and videos if present
    if (geminiImageFiles.length > 0) {
      contents.push({ text: "\n\nAnalyze these media files in relation to the Jira ticket implementation:" });
      
      // Add image files
      for (const imageFile of geminiImageFiles) {
        contents.push({
          file_data: {
            file_uri: imageFile.uri,
            mime_type: "image/jpeg" // Assuming most images will be JPEG
          }
        });
      }
      
      /* Comment out video file addition to contents array
      // Add video files
      for (const videoFile of geminiVideoFiles) {
        contents.push({
          file_data: {
            file_uri: videoFile.uri,
            mime_type: "video/mp4" // Assuming most videos will be MP4
          }
        });
      }
      */
    }
    
    // Make the API call
    const apiStartTime = Date.now();
    const response = await axios.post(GEMINI_API_URL, {
      contents: contents,
      generationConfig: GEMINI_CONFIG
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      }
    });
    const apiEndTime = Date.now();
    
    console.log(`✅ API call completed in ${(apiEndTime - apiStartTime) / 1000} seconds`);
    
    // Clean up uploaded files to avoid storage issues
    const cleanupStartTime = Date.now();
    
    try {
      // Clean up image files
      for (const imageFile of geminiImageFiles) {
        try {
          await axios.delete(`https://generativelanguage.googleapis.com/v1beta/files/${imageFile.name.split('/')[1]}`, {
            params: { key: GEMINI_API_KEY }
          });
          console.log(`🧹 Deleted image file: ${imageFile.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete image file ${imageFile.name}:`, error.message);
        }
      }
      
      /* Comment out video file cleanup
      // Clean up video files
      for (const videoFile of geminiVideoFiles) {
        try {
          await axios.delete(`https://generativelanguage.googleapis.com/v1beta/files/${videoFile.name.split('/')[1]}`, {
            params: { key: GEMINI_API_KEY }
          });
          console.log(`🧹 Deleted video file: ${videoFile.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete video file ${videoFile.name}:`, error.message);
        }
      }
      */
    } catch (error) {
      console.warn('⚠️ Error during file cleanup:', error.message);
    }

    console.log('=====================================');
    console.log('✅ Code Review Generation Complete!\n');

    return {
      success: true,
      data: response.data.candidates[0].content.parts[0].text
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
