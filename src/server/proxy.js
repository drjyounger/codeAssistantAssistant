const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

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
    const { filePath } = req.body;

    if (!isPathSafe(filePath)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access to this file is not allowed for security reasons' 
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, content });
  } catch (error) {
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

    // Validate required data
    if (!concatenatedFiles) {
      return res.status(400).json({
        success: false,
        error: 'No files provided for review'
      });
    }

    // Here you would call your LLM service (e.g., Google Gemini)
    // For now, let's return a mock response
    const review = {
      success: true,
      review: `Mock code review for:
        - Jira Ticket: ${jiraTicket?.key || 'N/A'}
        - PR: ${githubPR?.number || 'N/A'}
        - Files reviewed: ${concatenatedFiles.length} characters
        - Reference files: ${referenceFiles.length} files`
    };

    res.json(review);
  } catch (error) {
    console.error('Error generating review:', error);
    res.status(500).json({
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
  // Prevent reading sensitive directories
  const sensitivePatterns = [
    /\/\.git\//,
    /\/node_modules\//,
    /\/\.env/,
    /\/\.ssh\//,
    /\/\.aws\//
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(filePath));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 