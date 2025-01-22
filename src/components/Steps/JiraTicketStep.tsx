import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getTicketDetails } from '../../services/JiraService';
import { JiraTicket } from '../../types';

const JiraTicketStep: React.FC = () => {
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<JiraTicket | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('[client] [Step1:JiraTicket] Attempting to fetch Jira ticket:', ticketNumber);

    try {
      const response = await getTicketDetails(ticketNumber);
      
      if (response.success && response.data) {
        console.log('[client] [Step1:JiraTicket] Successfully retrieved Jira ticket data:', response.data);
        setTicket(response.data);
        localStorage.setItem('jiraTicket', JSON.stringify(response.data));
        console.log('[client] [Step1:JiraTicket] Stored ticket in localStorage. Navigating to GitHub PR step.');
        navigate('/github-pr');
      } else {
        setError(response.error || 'Failed to fetch ticket details');
      }
    } catch (err) {
      console.error('[client] [Step1:JiraTicket] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 1: Enter Jira Ticket
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Jira Ticket Number"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="e.g., PROJ-123"
            disabled={loading}
            error={!!error}
            helperText={error}
          />
        </Box>

        {ticket && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Ticket found: {ticket.summary}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!ticketNumber || loading}
            endIcon={loading && <CircularProgress size={20} />}
          >
            Next
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default JiraTicketStep; 