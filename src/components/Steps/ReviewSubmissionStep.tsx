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
import { generateSystemPrompt } from '../../prompts/systemPrompt';
import { REFERENCE_FILES } from '../../references/referenceManifest';
import { JiraTicket, UploadedVideo } from '../../types';
import { UploadedImage } from '../ImageUploadComponent';

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
      const jiraTickets = JSON.parse(localStorage.getItem('jiraTickets') || '[]') as JiraTicket[];
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceContents = JSON.parse(localStorage.getItem('referenceContents') || '{}');
      const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]') as UploadedImage[];
      const uploadedVideos = JSON.parse(localStorage.getItem('uploadedVideos') || '[]') as UploadedVideo[];

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
      console.log('[DEBUG] Uploaded images being submitted:', uploadedImages.length);
      console.log('[DEBUG] Uploaded videos being submitted:', uploadedVideos.length);

      console.log('[client] [Step5:ReviewSubmission] Sending data to LLM...');
      
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jiraTickets,
          concatenatedFiles,
          referenceFiles: validReferenceFiles,
          uploadedImages,
          uploadedVideos
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate review');
      }

      const result = await response.json();

      if (result.success) {
        console.log('[client] [Step5:ReviewSubmission] Successfully received code review. Storing and navigating to results...');
        localStorage.setItem('reviewResult', JSON.stringify({
          review: result.review,
          suggestions: [],
          score: 0
        }));
        navigate('/review-result');
      } else {
        throw new Error(result.error || 'Failed to generate review');
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
      const jiraTickets = JSON.parse(localStorage.getItem('jiraTickets') || '[]') as JiraTicket[];
      const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      const referenceContents = JSON.parse(localStorage.getItem('referenceContents') || '{}');
      const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]') as UploadedImage[];
      const uploadedVideos = JSON.parse(localStorage.getItem('uploadedVideos') || '[]') as UploadedVideo[];

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
        jiraTickets,
        concatenatedFiles,
        referenceFiles: validReferenceFiles,
        designImages: uploadedImages,
        uploadedVideos
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