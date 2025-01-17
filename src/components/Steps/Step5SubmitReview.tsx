import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { generateCodeReview } from '../../services/LLMService';
import { JiraTicket, GitHubPR } from '../../types';

const Step5SubmitReview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    jiraTicket: JiraTicket | null;
    githubPR: GitHubPR | null;
    concatenatedFiles: string | null;
    referenceFiles: string[];
  }>({
    jiraTicket: null,
    githubPR: null,
    concatenatedFiles: null,
    referenceFiles: [],
  });

  // Load data from previous steps
  useEffect(() => {
    const jiraTicket = localStorage.getItem('jiraTicket');
    const githubPR = localStorage.getItem('githubPR');
    const concatenatedFiles = localStorage.getItem('concatenatedFiles');
    const referenceFiles = localStorage.getItem('referenceFiles');

    if (!jiraTicket || !githubPR || !concatenatedFiles) {
      navigate('/jira-ticket');
      return;
    }

    setReviewData({
      jiraTicket: JSON.parse(jiraTicket),
      githubPR: JSON.parse(githubPR),
      concatenatedFiles: concatenatedFiles,
      referenceFiles: referenceFiles ? JSON.parse(referenceFiles) : [],
    });
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateCodeReview({
        jiraTicket: reviewData.jiraTicket,
        githubPR: reviewData.githubPR,
        concatenatedFiles: reviewData.concatenatedFiles || '',
        referenceFiles: reviewData.referenceFiles,
        systemPrompt: '', // This is generated inside generateCodeReview
      });

      if (response.success && response.data) {
        // Store the review result
        localStorage.setItem('reviewResult', JSON.stringify(response.data));
        navigate('/review-result');
      } else {
        throw new Error(response.error || 'Failed to generate review');
      }
    } catch (err) {
      setError('Failed to generate code review. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 5: Review Summary & Submit
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        <ListItem>
          <ListItemText
            primary="Jira Ticket"
            secondary={`${reviewData.jiraTicket?.key}: ${reviewData.jiraTicket?.summary}`}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="GitHub Pull Request"
            secondary={`#${reviewData.githubPR?.number}: ${reviewData.githubPR?.title}`}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Changed Files"
            secondary={reviewData.githubPR?.changedFiles.map(f => f.filename).join(', ')}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Reference Files"
            secondary={reviewData.referenceFiles.length > 0 
              ? reviewData.referenceFiles.join(', ')
              : 'No reference files selected'}
          />
        </ListItem>
      </List>

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
          endIcon={loading && <CircularProgress size={20} />}
        >
          Generate Review
        </Button>
      </Box>
    </Paper>
  );
};

export default Step5SubmitReview;
