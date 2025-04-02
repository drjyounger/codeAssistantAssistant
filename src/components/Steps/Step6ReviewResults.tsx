import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { JiraTicket } from '../../types';

interface ReviewResult {
  review: string;
  suggestions: string[];
  score: number;
}

interface Sections {
  [key: string]: string;
  summary: string;
  criticalIssues: string;
  recommendations: string;
  highlights: string;
  breakdown: string;
}

const Step6ReviewResults: React.FC = () => {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Review copied to clipboard');
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([]);

  useEffect(() => {
    try {
      const storedReview = localStorage.getItem('reviewResult');
      if (!storedReview) {
        throw new Error('No review data found');
      }
      setReviewData(JSON.parse(storedReview));
      
      const storedTickets = localStorage.getItem('jiraTickets');
      if (storedTickets) {
        setJiraTickets(JSON.parse(storedTickets));
      }
    } catch (err) {
      setError('Failed to load review results');
      console.error(err);
    }
  }, []);

  // Parse review sections from the text
  const parseSections = (review: string) => {
    const sections: Sections = {
      summary: '',
      criticalIssues: '',
      recommendations: '',
      highlights: '',
      breakdown: ''
    };

    let currentSection = '';
    const lines = review.split('\n');

    for (const line of lines) {
      if (line.includes('1. SUMMARY')) {
        currentSection = 'summary';
      } else if (line.includes('2. CRITICAL ISSUES')) {
        currentSection = 'criticalIssues';
      } else if (line.includes('3. RECOMMENDATIONS')) {
        currentSection = 'recommendations';
      } else if (line.includes('4. POSITIVE HIGHLIGHTS')) {
        currentSection = 'highlights';
      } else if (line.includes('5. DETAILED BREAKDOWN')) {
        currentSection = 'breakdown';
      } else if (currentSection) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  };

  const defaultSections: Sections = {
    summary: '',
    criticalIssues: '',
    recommendations: '',
    highlights: '',
    breakdown: ''
  };

  const sections: Sections = reviewData ? parseSections(reviewData.review) : defaultSections;

  const handleCopyToClipboard = () => {
    if (reviewData?.review) {
      navigator.clipboard.writeText(reviewData.review)
        .then(() => {
          setSnackbarMessage('Review copied to clipboard');
          setSnackbarOpen(true);
        })
        .catch(err => {
          console.error('Failed to copy text:', err);
        });
    }
  };

  const generateFileName = () => {
    if (jiraTickets.length === 0) {
      return `OverviewPlan-Unknown-${new Date().toISOString().split('T')[0]}.md`;
    } else if (jiraTickets.length === 1) {
      return `OverviewPlan-${jiraTickets[0].key}.md`;
    } else {
      return `OverviewPlan-${jiraTickets[0].key}-Plus${jiraTickets.length - 1}.md`;
    }
  };

  const generateDetailedFileName = () => {
    if (jiraTickets.length === 0) {
      return `DetailedPlan-Unknown-${new Date().toISOString().split('T')[0]}.md`;
    } else if (jiraTickets.length === 1) {
      return `DetailedPlan-${jiraTickets[0].key}.md`;
    } else {
      return `DetailedPlan-${jiraTickets[0].key}-Plus${jiraTickets.length - 1}.md`;
    }
  };

  const handleDownload = async () => {
    if (reviewData?.review) {
      try {
        const fileName = generateFileName();
        const emptyFileName = generateDetailedFileName();
        
        // Call server endpoint to save file to specific directory
        const response = await fetch('/api/save-markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: reviewData.review,
            fileName: fileName,
            emptyFileName: emptyFileName
          }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to save file');
        }
        
        setSnackbarMessage(`Saved as ${fileName} and created empty ${emptyFileName} in TempStarsApp2 directory`);
        setSnackbarOpen(true);
        
        // Also offer browser download as fallback
        const blob = new Blob([reviewData.review], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
      } catch (err) {
        console.error('Error saving file:', err);
        setSnackbarMessage('Error saving files to specified directory. Downloaded to browser instead.');
        
        // Fallback to browser download
        const blob = new Blob([reviewData.review], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = generateFileName();
        link.click();
        URL.revokeObjectURL(url);
        
        setSnackbarOpen(true);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/submit-review')}>
          Back to Review Submission
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Code Review Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Copy entire review to clipboard">
            <IconButton 
              onClick={handleCopyToClipboard} 
              disabled={!reviewData?.review}
              color="primary"
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save Overview & create empty Detailed Plan files">
            <IconButton 
              onClick={handleDownload} 
              disabled={!reviewData?.review}
              color="primary"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {sections && (
        <Box sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.summary}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="error">Critical Issues</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.criticalIssues}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">Recommendations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.recommendations}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="success.main">Positive Highlights</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.highlights}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Detailed Breakdown</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.breakdown}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/submit-review')}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            localStorage.clear(); // Clear wizard data
            navigate('/jira-ticket');
          }}
        >
          Start New Review
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default Step6ReviewResults;
