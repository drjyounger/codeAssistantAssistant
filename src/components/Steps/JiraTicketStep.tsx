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
  const [ticketNumbers, setTicketNumbers] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);

  const handleFetchTickets = async () => {
    setError(null);
    setLoading(true);

    const ticketArray = ticketNumbers.split(',').map(t => t.trim()).filter(Boolean);
    
    try {
      const ticketPromises = ticketArray.map(number => getTicketDetails(number));
      const responses = await Promise.all(ticketPromises);
      
      const successfulTickets = responses
        .filter(response => response.success && response.data)
        .map(response => response.data!);

      if (successfulTickets.length > 0) {
        console.log('[client] [Step1:JiraTicket] Successfully retrieved Jira tickets:', successfulTickets);
        setTickets(successfulTickets);
      } else {
        setError('Failed to fetch any valid ticket details');
      }
    } catch (err) {
      console.error('[client] [Step1:JiraTicket] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (tickets.length > 0) {
      localStorage.setItem('jiraTickets', JSON.stringify(tickets));
      console.log('[client] [Step1:JiraTicket] Stored tickets in localStorage. Navigating to file selection step.');
      navigate('/file-selection');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 1: Enter Jira Ticket(s)
      </Typography>
      
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Jira Ticket Numbers"
            value={ticketNumbers}
            onChange={(e) => setTicketNumbers(e.target.value)}
            placeholder="e.g., PROJ-123, PROJ-124"
            disabled={loading}
            error={!!error}
            helperText={error || "Separate multiple tickets with commas"}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleFetchTickets}
            disabled={!ticketNumbers.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Fetch Tickets'}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!tickets || loading}
          >
            Next
          </Button>
        </Box>

        {tickets.length > 0 && (
          <Box sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            <Typography variant="body2" fontWeight="bold">
              Fetched Jira Tickets:
            </Typography>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(tickets, null, 2)}
            </pre>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default JiraTicketStep; 