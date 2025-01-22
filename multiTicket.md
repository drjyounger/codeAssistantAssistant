Below is a step-by-step guide for modifying the existing code so the user can enter multiple Jira tickets, separated by commas, and have them all fetched and stored. In the existing code, only one ticket is handled at a time. We’ll make changes so that if the user enters something like "PROJ-123, PROJ-456", it fetches both tickets separately and stores them together.

#1. General Approach
Instead of sending a single ticket (e.g. "PROJ-123") from the front-end to the back-end, we’ll:

Parse the user’s comma-separated input into an array of ticket IDs (e.g. ["PROJ-123", "PROJ-456"]).
Loop over each ticket ID in the front-end, calling your existing single-ticket endpoint (/api/jira/ticket/:ticketNumber) once per ticket.
Accumulate all Jira ticket data into an array in front-end state.
Store that array in local storage (so subsequent wizard steps can access them).
We won’t modify the back-end endpoint. The existing GET /api/jira/ticket/:ticketNumber route can stay. Each call fetches one ticket, and the front-end just calls it multiple times.

#2. Files & Code Changes
Below are the minimum changes to make multiple ticket handling work. Note that file paths may vary slightly in your setup; these instructions assume your structure is as shared in your snippet:

src/
  └─ components/
      └─ Steps/
         └─ JiraTicketStep.tsx   <-- We'll modify this primarily
  └─ services/
      └─ JiraService.ts          <-- We'll use existing fetch logic
      └─ ...
  └─ ...

#2.1 src/components/Steps/JiraTicketStep.tsx
Current Code (relevant parts)

const [ticketNumber, setTicketNumber] = useState('');
const [ticket, setTicket] = useState<JiraTicket | null>(null);

const handleFetchTicket = async () => {
  setLoading(true);
  try {
    const response = await getTicketDetails(ticketNumber);
    if (response.success && response.data) {
      setTicket(response.data);
    } else {
      setError(response.error || 'Failed to fetch ticket details');
    }
  } catch (err) {
    ...
  } finally {
    setLoading(false);
  }
};

const handleNext = () => {
  if (ticket) {
    localStorage.setItem('jiraTicket', JSON.stringify(ticket));
    navigate('/github-pr');
  }
};
What We Want to Do
We want to let users type something like "PROJ-123, PROJ-456, PROJ-789", parse that into multiple IDs, fetch them in a loop, and store them as an array.

Steps:

Rename ticketNumber to something like ticketNumbersInput to make it clear it can contain multiple values.
Parse ticketNumbersInput on comma-split, then map(t => t.trim()).
Loop over each splitted ID, calling getTicketDetails(id) from JiraService.
Store them in local state as tickets, an array of JiraTicket.
Store that array in localStorage, e.g., localStorage.setItem('jiraTickets', JSON.stringify(tickets)).
Example Implementation

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
  
  // We'll rename the single 'ticketNumber' to 'ticketNumbersInput'
  const [ticketNumbersInput, setTicketNumbersInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instead of a single ticket, store multiple tickets
  const [tickets, setTickets] = useState<JiraTicket[]>([]);

  const handleFetchTickets = async () => {
    setError(null);
    setLoading(true);

    // Split by comma and trim
    const ticketIDs = ticketNumbersInput
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ticketIDs.length === 0) {
      setError('Please enter at least one valid ticket number');
      setLoading(false);
      return;
    }

    try {
      const fetchedTickets: JiraTicket[] = [];

      // Loop over each ID, fetch from Jira
      for (const ticketID of ticketIDs) {
        const response = await getTicketDetails(ticketID);
        if (response.success && response.data) {
          fetchedTickets.push(response.data);
        } else {
          // If one fails, show an error, but you could also skip or continue
          throw new Error(response.error || `Failed to fetch ticket ${ticketID}`);
        }
      }

      // If all fetches succeeded, store them in state
      setTickets(fetchedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Jira tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (tickets.length === 0) {
      setError('No tickets loaded. Please fetch tickets first.');
      return;
    }
    // Save to localStorage
    localStorage.setItem('jiraTickets', JSON.stringify(tickets));
    // Then navigate
    navigate('/github-pr'); 
    // or whichever route is next in your wizard 
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 1: Enter Jira Ticket(s)
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Jira Ticket Numbers (comma-separated)"
          value={ticketNumbersInput}
          onChange={(e) => setTicketNumbersInput(e.target.value)}
          placeholder="e.g., PROJ-123, PROJ-456"
          disabled={loading}
          error={!!error}
          helperText={error || 'Enter one or more tickets, separated by commas'}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleFetchTickets}
          disabled={!ticketNumbersInput.trim() || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Fetch Tickets'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || tickets.length === 0}
        >
          Next
        </Button>
      </Box>

      {/* Display fetched tickets JSON for debugging */}
      {tickets.length > 0 && (
        <Box sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
          <Typography variant="body2" fontWeight="bold">
            Fetched Jira Tickets:
          </Typography>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
            }}
          >
            {JSON.stringify(tickets, null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default JiraTicketStep;
Explanation of Key Changes
ticketNumbersInput: A single string with comma-separated IDs.
Split to get an array of IDs (ticketIDs).
Loop getTicketDetails(ticketID) for each ID, pushing successful results to fetchedTickets.
If any fail, we throw an error to show a single error message (you can tailor this behavior).
At the end, store the entire tickets array in local state and localStorage.

#2.2 src/services/JiraService.ts
You can leave this file as is if you want to rely on the existing single-ticket function (getTicketDetails(ticketNumber)). Our new approach just calls that function multiple times in a loop from JiraTicketStep.tsx.

No changes are strictly required unless you prefer to add a new function like getMultipleTicketDetails(ticketIDs: string[]). The current single-ticket approach is simpler.

#2.3 Back-End (src/server/proxy.js)
If we’re just calling /api/jira/ticket/${ticketNumber} multiple times from the front-end, no changes are strictly required on the server side. The existing route:

app.get('/api/jira/ticket/:ticketNumber', async (req, res) => {
  // ...
});
will be called once per ticket ID.

Optional: If you prefer a single request with multiple tickets, you’d create a new endpoint (e.g., POST /api/jira/tickets) that accepts an array of IDs in the body. But that’s more advanced and requires changes to how you parse them on the server. The straightforward approach is to do the loop in the client.

#3. Consuming Multiple Tickets in Later Steps
Now that you have multiple Jira tickets saved to local storage under jiraTickets (instead of a single jiraTicket), you may also want to:

Read them in the next step(s). For example, in whichever step references Jira data (like ReviewSubmissionStep.tsx or wherever you used JSON.parse(localStorage.getItem('jiraTicket') ...)), you’ll want to parse an array:

const stored = localStorage.getItem('jiraTickets');
if (stored) {
  const tickets: JiraTicket[] = JSON.parse(stored);
  // do something with the array of tickets
}
Include them in your final LLM call. If your system prompt expects multiple tickets, you might need to adapt generateSystemPrompt to handle an array of tickets (by looping over them or combining them in the text). For instance:

// Instead of a single "jiraTicket"
// You can do something like:
jiraTickets.map((t) => `Ticket ${t.key}: ${t.summary} ...`).join('\n')
Make sure subsequent steps don’t break because they were coded to handle a single object.