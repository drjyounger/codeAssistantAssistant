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

  const handleFetchTicket = async () => {
    setError(null);
    setLoading(true);

    console.log('[client] [Step1:JiraTicket] Attempting to fetch Jira ticket:', ticketNumber);

    try {
      const response = await getTicketDetails(ticketNumber);
      
      if (response.success && response.data) {
        console.log('[client] [Step1:JiraTicket] Successfully retrieved Jira ticket data:', response.data);
        setTicket(response.data);
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

  const handleNext = () => {
    if (ticket) {
      localStorage.setItem('jiraTicket', JSON.stringify(ticket));
      console.log('[client] [Step1:JiraTicket] Stored ticket in localStorage. Navigating to GitHub PR step.');
      navigate('/github-pr');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 1: Enter Jira Ticket
      </Typography>
      
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
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

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleFetchTicket}
            disabled={!ticketNumber.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Fetch Ticket'}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!ticket || loading}
          >
            Next
          </Button>
        </Box>

        {ticket && (
          <Box sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            <Typography variant="body2" fontWeight="bold">
              Fetched Jira Ticket:
            </Typography>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(ticket, null, 2)}
            </pre>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default JiraTicketStep; 