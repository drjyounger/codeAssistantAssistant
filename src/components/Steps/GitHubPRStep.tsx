import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { getPullRequestDetails } from '../../services/GitHubService';
import { PRDetails } from '../../types';
import { STORAGE_KEYS, saveGitHubPRs, getGitHubPRs } from '../../utils/storage';

const REPOS = {
  frontend: {
    owner: 'drjyounger',
    name: 'tempstars-app'
  },
  backend: {
    owner: 'drjyounger',
    name: 'tempstars-api'
  }
};

const GitHubPRStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [prs, setPRs] = useState({
    frontend: { number: '', selected: false },
    backend: { number: '', selected: false }
  });

  const handlePRSubmit = async () => {
    console.log('[client] [Step2:GitHubPR] Starting PR submission with:', prs);
    setLoading(true);
    setError(null);
    
    try {
      const prDetails: PRDetails = {
        frontend: null,
        backend: null
      };
      const promises = [];

      console.log('Selected PRs:', prs);

      if (prs.frontend.selected && prs.frontend.number) {
        console.log(`[client] [Step2:GitHubPR] Fetching frontend PR #${prs.frontend.number}...`);
        promises.push(
          getPullRequestDetails(
            parseInt(prs.frontend.number), 
            REPOS.frontend.owner, 
            REPOS.frontend.name
          ).then(result => {
            console.log('Frontend PR result:', result);
            if (result.success && result.data) {
              prDetails.frontend = result.data;
            } else {
              throw new Error(`Frontend PR Error: ${result.error}`);
            }
          })
        );
      }

      if (prs.backend.selected && prs.backend.number) {
        console.log(`[client] [Step2:GitHubPR] Fetching backend PR #${prs.backend.number}...`);
        promises.push(
          getPullRequestDetails(
            parseInt(prs.backend.number),
            REPOS.backend.owner,
            REPOS.backend.name
          ).then(result => {
            console.log('Backend PR result:', result);
            if (result.success && result.data) {
              prDetails.backend = result.data;
            } else {
              throw new Error(`Backend PR Error: ${result.error}`);
            }
          })
        );
      }

      if (promises.length === 0) {
        throw new Error('Please select at least one PR to review');
      }

      await Promise.all(promises);
      console.log('[client] [Step2:GitHubPR] Final PR Details:', prDetails);

      // Store PR details
      saveGitHubPRs(prDetails);
      
      console.log('[client] [Step2:GitHubPR] Saved PR details to localStorage. Navigating to file selection...');
      navigate('/file-selection');
      console.log('Navigation triggered');

    } catch (err) {
      console.error('[client] [Step2:GitHubPR] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PR details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (repo: 'frontend' | 'backend', value: string) => {
    setPRs(prev => ({
      ...prev,
      [repo]: { ...prev[repo], number: value }
    }));
  };

  const handleCheckboxChange = (repo: 'frontend' | 'backend') => {
    setPRs(prev => ({
      ...prev,
      [repo]: { ...prev[repo], selected: !prev[repo].selected }
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 2: GitHub Pull Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={prs.frontend.selected}
              onChange={() => handleCheckboxChange('frontend')}
            />
          }
          label="Front End (tempstars-app)"
        />
        {prs.frontend.selected && (
          <TextField
            fullWidth
            label="PR Number"
            value={prs.frontend.number}
            onChange={(e) => handleInputChange('frontend', e.target.value)}
            sx={{ mt: 1 }}
            disabled={loading}
          />
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={prs.backend.selected}
              onChange={() => handleCheckboxChange('backend')}
            />
          }
          label="Back End (tempstars-api)"
        />
        {prs.backend.selected && (
          <TextField
            fullWidth
            label="PR Number"
            value={prs.backend.number}
            onChange={(e) => handleInputChange('backend', e.target.value)}
            sx={{ mt: 1 }}
            disabled={loading}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
          endIcon={loading && <CircularProgress size={20} />}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

// Reading data:
const savedPRs = getGitHubPRs();

export default GitHubPRStep; 