const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs').promises;
const { generateSystemPrompt } = require('../prompts/systemPrompt');

const app = express();
app.use(cors());
app.use(express.json());

const JIRA_API_BASE_URL = process.env.REACT_APP_JIRA_API_URL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;

app.get('/api/jira/ticket/:ticketNumber', async (req, res) => {
  try {
    console.log('JIRA API URL:', JIRA_API_BASE_URL);
    console.log('Ticket Number:', req.params.ticketNumber);
    console.log('Auth Token Present:', !!JIRA_API_TOKEN);
    
    if (!JIRA_API_BASE_URL || !JIRA_API_TOKEN) {
      throw new Error('Missing required JIRA environment variables');
    }

    const authToken = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

    const response = await axios.get(
      `${JIRA_API_BASE_URL}/rest/api/2/issue/${req.params.ticketNumber}`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('JIRA API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch Jira ticket details',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/local/directory', async (req, res) => {
  try {
    const { rootPath } = req.body;
    
    if (!isPathSafe(rootPath)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access to this directory is not allowed for security reasons' 
      });
    }

    const items = await fs.readdir(rootPath, { withFileTypes: true });
    
    const dirStructure = await Promise.all(items.map(async (item) => {
      const fullPath = path.join(rootPath, item.name);
      return {
        id: fullPath,
        name: item.name,
        isDirectory: item.isDirectory(),
        children: item.isDirectory() ? await readDirRecursive(fullPath) : null
      };
    }));

    res.json({ success: true, data: dirStructure });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Failed to read directory: ${error.message}` 
    });
  }
});

app.post('/api/local/file', async (req, res) => {
  try {
    const { filePath, isReference } = req.body;
    
    console.log('[DEBUG] File request:', {
      filePath,
      isReference,
      __dirname,
      cwd: process.cwd()
    });

    // Handle reference files differently
    const absolutePath = isReference 
      ? path.join(__dirname, '..', '..', filePath) // Go up two levels to project root
      : path.resolve(process.cwd(), filePath);

    console.log('[DEBUG] Resolved path:', absolutePath);

    // Verify file exists
    try {
      await fs.access(absolutePath);
    } catch (err) {
      console.error('[DEBUG] File not found:', absolutePath);
      return res.status(404).json({ 
        success: false, 
        error: `File not found: ${filePath}` 
      });
    }

    // Read and return file content
    const content = await fs.readFile(absolutePath, 'utf8');
    res.json({ success: true, content });
  } catch (error) {
    console.error('[DEBUG] Error reading file:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to read file: ${error.message}` 
    });
  }
});

app.post('/api/concatenate-files', async (req, res) => {
  try {
    const { files, prNumber } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files selected for concatenation'
      });
    }

    // Read and concatenate all files
    const fileContents = await Promise.all(
      files.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const fileName = path.basename(filePath);
          return `\n\n# File: ${fileName}\n\`\`\`\n${content}\n\`\`\``;
        } catch (err) {
          console.error(`Error reading file ${filePath}:`, err);
          return `\n\n# Error reading file: ${filePath}\n`;
        }
      })
    );

    const concatenatedContent = fileContents.join('\n');

    res.json({
      success: true,
      data: concatenatedContent
    });
  } catch (error) {
    console.error('Error concatenating files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to concatenate files'
    });
  }
});

app.post('/api/generate-review', async (req, res) => {
  try {
    const { jiraTicket, githubPR, concatenatedFiles, referenceFiles } = req.body;
    console.log('[DEBUG] Generate review request received with:', {
      hasJiraTicket: !!jiraTicket,
      hasGithubPR: !!githubPR,
      concatenatedFilesLength: concatenatedFiles?.length || 0,
      referenceFiles: referenceFiles
    });

    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    if (!concatenatedFiles) {
      return res.status(400).json({
        success: false,
        error: 'No files provided for review'
      });
    }

    // Generate the prompt
    const promptString = generateSystemPrompt({
      jiraTicket,
      githubPR,
      concatenatedFiles,
      additionalFiles: referenceFiles,
    });

    // Call Gemini API
    const geminiResponse = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: promptString
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          candidateCount: 1
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    // Safely extract the generated text
    const generatedText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('Unexpected response format from Gemini API');
    }

    res.json({
      success: true,
      review: generatedText
    });
  } catch (error) {
    console.error('Error generating review:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Failed to generate review'
    });
  }
});

// Helper function for recursive directory reading
async function readDirRecursive(dirPath) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const result = await Promise.all(items.map(async (item) => {
    const fullPath = path.join(dirPath, item.name);
    return {
      id: fullPath,
      name: item.name,
      isDirectory: item.isDirectory(),
      children: item.isDirectory() ? await readDirRecursive(fullPath) : null
    };
  }));
  return result;
}

function isPathSafe(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Explicitly allow reference files
  if (normalizedPath.includes('references/')) {
    return true;
  }
  
  // Prevent reading sensitive directories
  const sensitivePatterns = [
    /\/\.git\//,
    /\/node_modules\//,
    /\/\.env/,
    /\/\.ssh\//,
    /\/\.aws\//
  ];
  
  const isSafe = !sensitivePatterns.some(pattern => pattern.test(normalizedPath));
  return isSafe;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 