Next step changes to implement:

1. Jira Ticket Parsing – Only store key, summary, and description, omitting acceptanceCriteria and linkedEpics.

2. GitHub PR Fetch – Gather more fields from GitHub (e.g. author, created date, merges, etc.) to display a richer preview.

3. File Tree & Folder Expansion – Avoid errors when a folder is selected (i.e., “Error reading file …”), and allow folders to expand to show child files. This means adding a click-to-expand or arrow logic in FileTree.tsx that uses MUI’s TreeItem hierarchy.

4. Use systemPrompt.ts for a richer final prompt. Right now, your “Preview” step uses a minimal string. Incorporate your more robust generateSystemPrompt() from systemPrompt.ts so the user sees the same final system prompt that goes to the LLM.

Below is step-by-step guidance and example code snippets.

#1. Jira Ticket: Only Key, Summary, Description
In src/services/JiraService.ts, your getTicketDetails function transforms the Jira response into a JiraTicket. By default, it also tries to parse acceptance criteria and epics. You can simply omit them or parse them into description if that’s your preference. For example:


// src/services/JiraService.ts
import axios from 'axios';
import { JiraTicket, ApiResponse } from '../types';

export const getTicketDetails = async (ticketNumber: string): Promise<ApiResponse<JiraTicket>> => {
  try {
    const response = await axios.get(...);

    // Original code extracted acceptanceCriteria and linkedEpics
-   const ticket: JiraTicket = {
-     key: data.key,
-     summary: data.fields.summary,
-     description: data.fields.description,
-     acceptanceCriteria: data.fields.customfield_10000 || '',
-     linkedEpics: ...
-   };

+   // Only store what you actually need:
+   const ticket: JiraTicket = {
+     key: response.data.key,
+     summary: response.data.fields.summary,
+     // Combine acceptance criteria into the description if you'd like,
+     // or just store the raw description from Jira:
+     description: response.data.fields.description || ''
+   };

    return { success: true, data: ticket };

  } catch (error: any) {
    ...
  }
};
Adjust your JiraTicket type if needed:

typescript
Copy
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  // Remove acceptanceCriteria, linkedEpics if not needed
}
Now your preview JSON for the Jira step will only have key, summary, and description.

#2. GitHub PR: More Data Fields
Octokit returns a rich PR object in prData. You can capture as many fields as you want in your getPullRequestDetails method. For instance:


// src/services/GitHubService.ts

export const getPullRequestDetails = async (
  prNumber: number,
  owner: string,
  repo: string
): Promise<ApiResponse<GitHubPR>> => {

  try {
    // Fetch PR details
    const { data: prData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Also fetch PR files
    const { data: files } = await octokit.pulls.listFiles({ ... });

+   // Additional fields from the PR
+   // e.g. user (the author), created date, state, labels, etc.
+   const author = prData.user?.login ?? '';
+   const createdAt = prData.created_at; 
+   const isMerged = !!prData.merged_at;
+   const mergeable = prData.mergeable;
+   const labels = prData.labels?.map(label => label.name);

    const pullRequest: GitHubPR = {
      number: prData.number,
      title: prData.title,
      description: prData.body || '',
      repo: { owner, name: repo },
      changedFiles: files.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        patch: file.patch,
      })),
+     author,
+     createdAt,
+     isMerged,
+     mergeable,
+     labels
    };

    return { success: true, data: pullRequest };

  } catch (error) {
    ...
  }
};
Then update your GitHubPR interface:

// src/types/index.ts
export interface GitHubPR {
  number: number;
  title: string;
  description: string;
  repo: { owner: string; name: string };
  changedFiles: GitHubFile[];
+ author?: string;       // the PR author’s login
+ createdAt?: string;    // date/time created
+ isMerged?: boolean;    // merged_at != null
+ mergeable?: boolean;   // can GitHub merge this PR?
+ labels?: string[];     // e.g. ['bug','enhancement']
}
Now your “Fetched PR” JSON will be more robust, giving you more context to display in the preview step.

#3. File Tree: Folder Expansion & Skipping Directory Concatenation

A. Expanding Folders

In your FileTree.tsx component (which uses MUI’s @mui/x-tree-view), you likely want to show an expand/collapse arrow. Right now you do display an arrow via slots={{ expandIcon, collapseIcon }} but you mention it’s not actually expanding. Ensure your TreeItems each have child TreeItems in their children prop, and that you’re using the correct SimpleTreeView expansions. For instance:

<TreeItem
  key={node.id}
  itemId={node.id}
  label={...}
>
  {node.children?.map((child) => renderTree(child))}
</TreeItem>
If you see “Error reading file” for a directory, that means your concatenate-files endpoint is trying to read a folder as a file. You should skip or handle directories differently:

// In /api/concatenate-files or your client code:
if (fsStat.isDirectory()) {
  // skip or recursively handle?
  // Usually skip, because you only want .txt, .ts, .js, etc. 
}
Key: The final fix is to ensure your selection logic never tries to read a directory. This can be done in FileTree by ignoring clicks on folder nodes or storing them but skipping them in the server. That’s up to your exact design.

B. Recursive Checking (if desired)
If you want to check a folder and automatically select everything inside it, you’ll need to implement a small helper function that does a DFS through the node’s children, collecting all file paths. We showed a snippet previously, but the main concept is:

// In handleCheck...
if (node.isDirectory) {
  const childPaths = getAllChildPaths(node);
  // add them to selected
} else {
  // toggle single file
}

#4. Use systemPrompt.ts for the ReviewSubmission Preview
Right now, your final preview is a small, ad-hoc template:

const promptString = `You are an expert-level code reviewer for TempStars... JIRA TICKET: ... PR: ... `;
But you already have a “systemPrompt.ts” that’s more detailed. To unify them, you can:

Import generateSystemPrompt from systemPrompt.ts.
Use that function in your ReviewSubmissionStep.tsx for the “Preview API Call” button as well as the final submission—so that what you see is exactly what goes to the LLM.
Example:

// src/components/Steps/ReviewSubmissionStep.tsx
+ import { generateSystemPrompt } from '../../prompts/systemPrompt';

const handlePreviewPrompt = () => {
  try {
    const jiraTicket = JSON.parse(localStorage.getItem('jiraTicket') || '{}');
    const githubPR = JSON.parse(localStorage.getItem('githubPRs') || '{}');
    const concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
    const referenceFiles = JSON.parse(localStorage.getItem('referenceFiles') || '[]');

    // Instead of ad-hoc:
-   const promptString = `You are an expert-level code reviewer...`;

+   const promptString = generateSystemPrompt({
+     jiraTicket,
+     githubPR,
+     concatenatedFiles,
+     additionalFiles: referenceFiles
+   });

    setPromptPreview(promptString);
  } catch (err) {
    ...
  }
};
This ensures your preview is the same rich prompt you’d expect in the final LLM call.

#5. Improving Formatting & Sections in the System Prompt
If you want your prompt’s sections to appear more clearly, you can do something like:

// In systemPrompt.ts
export const generateSystemPrompt = ({ 
  jiraTicket, 
  githubPR, 
  concatenatedFiles, 
  additionalFiles 
}) => {

  return `
You are an expert-level code reviewer for TempStars...

1) Jira Ticket:
Key: ${jiraTicket.key}
Summary: ${jiraTicket.summary}
Description:
${jiraTicket.description}

2) GitHub Pull Request:
Number: ${githubPR.number}
Title: ${githubPR.title}
Author: ${githubPR.author || ''}
Created: ${githubPR.createdAt || ''}
// etc.

3) Concatenated Code:
${concatenatedFiles}

4) Additional Reference Files:
${(additionalFiles || []).join('\n')}

// ...
Please provide your review with these guidelines:
1. SUMMARY
2. CRITICAL ISSUES
3. RECOMMENDATIONS
4. POSITIVE HIGHLIGHTS
5. DETAILED BREAKDOWN
`.trim();
};
Feel free to reorganize sections or add new bullet points for clarity.

#Putting It All Together
Jira: Strip out acceptance criteria and epics from the final JSON if unneeded.
PR: Capture more data from GitHub by expanding your pulls.get payload.
File Selection:
Expand/collapse folders in the UI by ensuring your TreeItem has children.
Skip or handle directories gracefully in /api/concatenate-files.
(Optional) Implement recursive check if you want “folder check = all subfiles.”
System Prompt: In ReviewSubmissionStep, replace the minimal preview with a direct call to generateSystemPrompt(), so the user sees the exact prompt that will be sent to the LLM.
By doing these, you’ll have:

A Jira step that shows only the relevant fields.
A more comprehensive GitHub PR preview (author, creation date, labels, etc.).
A file tree that truly expands subfolders and doesn’t fail if a directory is selected.
A robust final system prompt that matches .cursorrules and ensures your LLM gets the full context.