import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

// Import steps (we'll create these next)
import JiraTicketStep from './components/Steps/JiraTicketStep';
import FileSelectionStep from './components/Steps/FileSelectionStep';
import AdditionalFilesStep from './components/Steps/AdditionalFilesStep';
import ReviewSubmissionStep from './components/Steps/ReviewSubmissionStep';
import Step6ReviewResults from './components/Steps/Step6ReviewResults';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/jira-ticket" />} />
      <Route path="/jira-ticket" element={<JiraTicketStep />} />
      <Route path="/file-selection" element={<FileSelectionStep />} />
      <Route path="/additional-files" element={<AdditionalFilesStep />} />
      <Route path="/submit-review" element={<ReviewSubmissionStep />} />
      <Route path="/review-result" element={<Step6ReviewResults />} />
    </Routes>
  );
};

export default App;
