import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

// Import steps (we'll create these next)
import JiraTicketStep from './components/steps/JiraTicketStep';
import GitHubPRStep from './components/steps/GitHubPRStep';
import FileSelectionStep from './components/steps/FileSelectionStep';
import AdditionalFilesStep from './components/steps/AdditionalFilesStep';
import ReviewSubmissionStep from './components/steps/ReviewSubmissionStep';
import ReviewResultStep from './components/steps/ReviewResultStep';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/jira-ticket" replace />} />
          <Route path="/jira-ticket" element={<JiraTicketStep />} />
          <Route path="/github-pr" element={<GitHubPRStep />} />
          <Route path="/file-selection" element={<FileSelectionStep />} />
          <Route path="/additional-files" element={<AdditionalFilesStep />} />
          <Route path="/submit-review" element={<ReviewSubmissionStep />} />
          <Route path="/review-result" element={<ReviewResultStep />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;
