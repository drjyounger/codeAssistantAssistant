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

  const [prDetails, setPrDetails] = useState<PRDetails>({
    frontend: null,
    backend: null
  });

  const handleFetchPRs = async () => {
    console.log('[client] [Step2:GitHubPR] Starting PR fetch with:', prs);
    setLoading(true);
    setError(null);
    
    try {
      const updatedPRDetails: PRDetails = {
        frontend: null,
        backend: null
      };

      // Validate environment variables first
      if (!process.env.REACT_APP_GITHUB_TOKEN) {
        throw new Error('GitHub token is not configured. Please check your .env file.');
      }

      const promises = [];

      if (prs.frontend.selected && prs.frontend.number) {
        console.log(`[client] [Step2:GitHubPR] Fetching frontend PR #${prs.frontend.number}...`);
        promises.push(
          getPullRequestDetails(
            parseInt(prs.frontend.number), 
            REPOS.frontend.owner, 
            REPOS.frontend.name
          ).then(result => {
            if (result.success && result.data) {
              updatedPRDetails.frontend = result.data;
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
            if (result.success && result.data) {
              updatedPRDetails.backend = result.data;
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
      console.log('[client] [Step2:GitHubPR] Final PR Details:', updatedPRDetails);
      setPrDetails(updatedPRDetails);

    } catch (err) {
      console.error('[client] [Step2:GitHubPR] Error:', err);
      // More detailed error message
      const errorMessage = err instanceof Error 
        ? `${err.message}\n${err.stack}`
        : 'Failed to fetch PR details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (prDetails.frontend || prDetails.backend) {
      saveGitHubPRs(prDetails);
      navigate('/file-selection');
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
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error}
          </pre>
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

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/jira-ticket')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleFetchPRs}
          disabled={loading || (!prs.frontend.selected && !prs.backend.selected)}
        >
          {loading ? <CircularProgress size={20} /> : 'Fetch PR(s)'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || (!prDetails.frontend && !prDetails.backend)}
        >
          Next
        </Button>
      </Box>

      {/* Display fetched PR details */}
      {(prDetails.frontend || prDetails.backend) && (
        <Box sx={{ mt: 2 }}>
          {prDetails.frontend && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Frontend PR #{prDetails.frontend.number}:
              </Typography>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(prDetails.frontend, null, 2)}
              </pre>
            </Box>
          )}
          {prDetails.backend && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Backend PR #{prDetails.backend.number}:
              </Typography>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(prDetails.backend, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Reading data:
const savedPRs = getGitHubPRs();

export default GitHubPRStep; 