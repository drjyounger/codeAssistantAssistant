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
import { generateSystemPrompt } from '../../prompts/systemPrompt';
import { REFERENCE_FILES } from '../../references/referenceManifest';

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

// Add interface for reference file structure
interface ReferenceFileContent {
  type: string;
  name: string;
  content: string;
}

const ReviewSubmissionStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptPreview, setPromptPreview] = useState<string>('');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    console.log('[client] [Step5:ReviewSubmission] Collecting stored data for LLM submission...');
    
    try {
      const jiraTicket = JSON.parse(localStorage.getItem('jiraTicket') || '{}');
      const githubPR = JSON.parse(localStorage.getItem('githubPRs') || '{}');
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceContents = JSON.parse(localStorage.getItem('referenceContents') || '{}');

      // Convert referenceContents into the format expected by the LLM
      const validReferenceFiles: ReferenceFileContent[] = Object.entries(referenceContents).map(([fileId, content]) => {
        const referenceFile = REFERENCE_FILES.find(f => f.id === fileId);
        return {
          type: referenceFile?.type || 'unknown',
          name: referenceFile?.name || fileId,
          content: content as string
        };
      });

      console.log('[DEBUG] Final references being submitted:', validReferenceFiles);

      console.log('[client] [Step5:ReviewSubmission] Sending data to LLM...');
      const review = await generateCodeReview({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles: validReferenceFiles
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

  const handlePreviewPrompt = () => {
    try {
      const jiraTicket = JSON.parse(localStorage.getItem('jiraTicket') || '{}');
      const githubPR = JSON.parse(localStorage.getItem('githubPRs') || '{}');
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceContents = JSON.parse(localStorage.getItem('referenceContents') || '{}');

      // Convert referenceContents into the format expected by the LLM
      const validReferenceFiles: ReferenceFileContent[] = Object.entries(referenceContents).map(([fileId, content]) => {
        const referenceFile = REFERENCE_FILES.find(f => f.id === fileId);
        return {
          type: referenceFile?.type || 'unknown',
          name: referenceFile?.name || fileId,
          content: content as string
        };
      });

      const promptString = generateSystemPrompt({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles: validReferenceFiles
      });

      setPromptPreview(promptString);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
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

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/additional-files')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePreviewPrompt}
          disabled={loading}
        >
          Preview API Call
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Submit Review'}
        </Button>
      </Box>

      {/* Display prompt preview */}
      {promptPreview && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            API Call Preview:
          </Typography>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {promptPreview}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default ReviewSubmissionStep; 