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

const ReviewSubmissionStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Safely parse stored data with fallbacks
      const jiraTicket = JSON.parse(localStorage.getItem('jiraTicket') || '{}');
      const githubPR = JSON.parse(localStorage.getItem('githubPRs') || '{}');
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceFiles = JSON.parse(localStorage.getItem('referenceFiles') || '[]');

      // Validate required data
      if (!concatenatedFiles) {
        throw new Error('No files selected for review');
      }

      console.log('Generating review with:', {
        jiraTicket,
        githubPR,
        concatenatedFilesLength: concatenatedFiles.length,
        referenceFiles
      });

      const review = await generateCodeReview({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles
      });

      if (review.success) {
        localStorage.setItem('reviewResult', JSON.stringify({
          review: review.data,
          suggestions: [],  // Add any additional metadata you want to preserve
          score: 0
        }));
        navigate('/review-result');
      } else {
        throw new Error(review.error || 'Failed to generate review');
      }
    } catch (err) {
      console.error('Error generating review:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate code review');
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