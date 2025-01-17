import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { getPullRequestDetails } from '../../services/GitHubService';

const REPOS = {
  frontend: {
    owner: 'drjyounger',
    name: 'tempstars-app',
    label: 'Frontend PR (tempstars-app)'
  },
  backend: {
    owner: 'drjyounger',
    name: 'tempstars-api',
    label: 'Backend PR (tempstars-api)'
  }
};

const GitHubPRStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Just track PR numbers and which repos are selected
  const [prs, setPRs] = useState({
    frontend: { number: '', selected: false },
    backend: { number: '', selected: false }
  });

  const handlePRSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const prDetails = { frontend: null, backend: null };
      const promises = [];

      // Fetch selected PR diffs
      if (prs.frontend.selected && prs.frontend.number) {
        promises.push(
          getPullRequestDetails(
            parseInt(prs.frontend.number), 
            REPOS.frontend.owner, 
            REPOS.frontend.name
          ).then(result => {
            if (result.success) prDetails.frontend = result.data;
            else throw new Error(`Frontend PR Error: ${result.error}`);
          })
        );
      }

      if (prs.backend.selected && prs.backend.number) {
        promises.push(
          getPullRequestDetails(
            parseInt(prs.backend.number),
            REPOS.backend.owner,
            REPOS.backend.name
          ).then(result => {
            if (result.success) prDetails.backend = result.data;
            else throw new Error(`Backend PR Error: ${result.error}`);
          })
        );
      }

      if (promises.length === 0) {
        throw new Error('Please select at least one PR to review');
      }

      await Promise.all(promises);

      // Store just the PR details and diffs
      localStorage.setItem('githubPRs', JSON.stringify(prDetails));
      
      // Move to file selection where user will pick local files
      navigate('/file-selection');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PR details');
    } finally {
      setLoading(false);
    }
  };

  const handlePRChange = (repo: 'frontend' | 'backend', field: 'number' | 'selected', value: string | boolean) => {
    setPRs(prev => ({
      ...prev,
      [repo]: {
        ...prev[repo],
        [field]: value
      }
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 2: GitHub Pull Request Details
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Select the pull requests to include in the review. The diffs will be included in the analysis context.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Frontend PR Input */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={prs.frontend.selected}
              onChange={(e) => handlePRChange('frontend', 'selected', e.target.checked)}
            />
          }
          label={REPOS.frontend.label}
        />
        {prs.frontend.selected && (
          <TextField
            fullWidth
            label="PR Number"
            value={prs.frontend.number}
            onChange={(e) => handlePRChange('frontend', 'number', e.target.value)}
            disabled={loading}
            sx={{ mt: 1 }}
            placeholder="e.g., 23245"
          />
        )}
      </Box>

      {/* Backend PR Input */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={prs.backend.selected}
              onChange={(e) => handlePRChange('backend', 'selected', e.target.checked)}
            />
          }
          label={REPOS.backend.label}
        />
        {prs.backend.selected && (
          <TextField
            fullWidth
            label="PR Number"
            value={prs.backend.number}
            onChange={(e) => handlePRChange('backend', 'number', e.target.value)}
            disabled={loading}
            sx={{ mt: 1 }}
            placeholder="e.g., 2560"
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/jira-ticket')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handlePRSubmit}
          disabled={loading || (!prs.frontend.selected && !prs.backend.selected)}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default GitHubPRStep; 