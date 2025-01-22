import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { generateCodeReview } from '../../services/LLMService';

interface JiraTicket {
  key: string;
  // Add other required Jira ticket fields
}

interface GithubPR {
  number: string;
  title: string;
  description: string;
  changedFiles: any[]; // Consider making this more specific
}

const ReviewSubmissionStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateData = (
    jiraTicket: any,
    githubPR: any,
    concatenatedFiles: string,
    referenceFiles: string[]
  ): { isValid: boolean; error?: string } => {
    // Validate Jira Ticket
    if (!jiraTicket?.key) {
      return { isValid: false, error: 'Invalid Jira ticket data. Please return to Step 1.' };
    }

    // Validate GitHub PR
    if (!githubPR?.number || !githubPR?.title || !githubPR?.changedFiles) {
      return { isValid: false, error: 'Invalid GitHub PR data. Please return to Step 2.' };
    }

    // Validate Concatenated Files
    if (!concatenatedFiles || concatenatedFiles.length === 0) {
      return { isValid: false, error: 'No files selected for review. Please return to Step 3.' };
    }

    // Reference files can be empty, but should be an array
    if (!Array.isArray(referenceFiles)) {
      return { isValid: false, error: 'Invalid reference files format. Please return to Step 4.' };
    }

    return { isValid: true };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    console.log('[client] [Step5:ReviewSubmission] Collecting stored data for LLM submission...');
    
    try {
      const jiraTicket = JSON.parse(localStorage.getItem('jiraTicket') || '{}');
      const githubPR = JSON.parse(localStorage.getItem('githubPRs') || '{}');
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceFiles = JSON.parse(localStorage.getItem('referenceFiles') || '[]');

      console.log('[client] [Step5:ReviewSubmission] Data collected:', {
        jiraTicket,
        githubPR,
        concatenatedFilesLength: concatenatedFiles.length,
        referenceFiles
      });

      console.log('[client] [Step5:ReviewSubmission] Sending data to LLM...');
      const review = await generateCodeReview({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles
      });

      if (review.success) {
        console.log('[client] [Step5:ReviewSubmission] Successfully received code review. Storing and navigating to results...');
        localStorage.setItem('reviewResult', JSON.stringify({
          review: review.data,
          suggestions: [],
          score: 0
        }));
        navigate('/review-result');
      }
    } catch (err) {
      console.error('[client] [Step5:ReviewSubmission] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Submit Code Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/additional-files')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Review'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ReviewSubmissionStep; 