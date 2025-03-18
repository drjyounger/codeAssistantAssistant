const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs').promises;
const { generateSystemPrompt } = require('../prompts/systemPrompt');
const { generateCodeReview } = require('../services/LLMService');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Helper function to safely check paths
const isPathSafe = (basePath, targetPath) => {
  const resolvedPath = path.resolve(targetPath);
  const resolvedBasePath = path.resolve(basePath);
  return resolvedPath.startsWith(resolvedBasePath);
};

// Helper function to read directory recursively
const readDirRecursive = async (dirPath) => {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      const children = await readDirRecursive(fullPath);
      result.push({
        id: fullPath,
        name: item.name,
        isDirectory: true,
        children
      });
    } else {
      result.push({
        id: fullPath,
        name: item.name,
        isDirectory: false
      });
    }
  }

  return result;
};

app.post('/api/local/directory', async (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'No folder path provided' });
    }

    // Verify the path exists and is a directory
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Path is not a directory' });
    }

    const data = await readDirRecursive(folderPath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading directory:', error);
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

// app.post('/api/concatenate-files', async (req, res) => { ... });

app.post('/api/generate-review', async (req, res) => {
  try {
    const { jiraTickets, concatenatedFiles, referenceFiles } = req.body;
    
    console.log('[DEBUG] Received request body:', {
      hasJiraTickets: !!jiraTickets,
      ticketsLength: jiraTickets?.length,
      hasFiles: !!concatenatedFiles,
      filesLength: concatenatedFiles?.length,
      referencesLength: referenceFiles?.length
    });
    
    if (!concatenatedFiles) {
      return res.status(400).json({
        success: false,
        error: 'No files provided for review'
      });
    }

    const result = await generateCodeReview({
      jiraTickets,
      concatenatedFiles,
      referenceFiles
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      review: result.data
    });
  } catch (error) {
    console.error('Error generating review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate review'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 