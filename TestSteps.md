I want to implement a way to test each step.  What I'm picturing is creating individutal files that, when run, test each step individually:

JiraFetch.js:  When this is run, it only fetchs and returns all the information of a hard-coded Jira ticket #

PullRequestFetch.js:  When this is run, it only fetches and returns all the information related to a specific hard-coded PR #

FileConcatenate.js:  When run, this opens the interface for entering the path of the starting directory, fetches the directory tree for that starting folder with checkboxes.  Selecting files and folders and hitting "Submit" then concatenates the files into one long text file

SubmitReview.js:  When run, it makes the api call to Gemini with mock data to review and returns the analysis.

By creating this ability to individually test each step in the wizard workflow, we can hone in on issues and bugs more easily.

Below is a step-by-step guide on creating four individual test scripts (JiraFetch.js, PullRequestFetch.js, FileConcatenate.js, and SubmitReview.js) so you can test each “wizard step” independently. 

In doing so, you’ll reuse much of the existing logic (e.g., your services, local file selection, LLM submission) without needing the entire UI or multi-step workflow running.

General Approach

Folder Structure

Place these test scripts in a convenient location—for example, a new scripts/ or tests/manual/ folder in your project’s root.

Each script will be run with Node (e.g. node JiraFetch.js) and will:
Import the relevant service or function from your existing code.
Hard-code or ask for user input to replicate each step’s functionality.
Log (or display) the results in the terminal.
Environment Variables

Ensure your .env or environment variables for JIRA, GitHub, and the Gemini LLM are set in your Node environment. That means the same environment variables you use in your code (like REACT_APP_JIRA_API_TOKEN, etc.) must be accessible when running node .... If they’re not, either rename them or set them manually for these scripts.
TypeScript vs. JavaScript

If your existing code is in TypeScript, you have two main options for these scripts:
Write them in plain JavaScript (.js) and compile them with Node (you may need ts-node or a separate build script if you want them in TypeScript).
Write them as .ts scripts and run them with ts-node.
For simplicity, this guide assumes plain .js scripts. If you want TypeScript, just adapt accordingly (e.g. import ... from ...; with TypeScript and run via ts-node myScript.ts).

1. JiraFetch.js
Purpose
Test Step 1 logic alone—fetching a Jira ticket by a hard-coded issue number and printing the results.

High-Level Steps
Import your getTicketDetails function from JiraService.ts.
Read any needed environment variables (like process.env.REACT_APP_JIRA_API_URL).
Set a hard-coded ticket number (e.g., PROJ-123) or prompt the user in the console for a ticket number if you want interactive testing.
Call getTicketDetails(ticketNumber).
Log or output the result.
Detailed Example

// scripts/JiraFetch.js
require('dotenv').config();  // so we can read from .env
const path = require('path');

// Because your service is in TypeScript, either transpile it or use ts-node/require it in:
const { getTicketDetails } = require('../src/services/JiraService'); // adjust path if needed

(async function testJiraFetch() {
  try {
    const hardcodedTicketNumber = 'PROJ-123'; // example
    console.log(`Fetching Jira Ticket: ${hardcodedTicketNumber} ...`);

    const result = await getTicketDetails(hardcodedTicketNumber);
    console.log('Jira Ticket Fetch Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching Jira ticket:', error);
  }
})();
How to run:

cd scripts
node JiraFetch.js
If everything is set up properly, you’ll see the fetched Jira ticket info or an error if environment variables aren’t correct.

2. PullRequestFetch.js
Purpose
Test Step 2 logic alone—fetching GitHub PR details for a specified PR number.

High-Level Steps
Import your getPullRequestDetails from GitHubService.ts.
Hard-code or prompt a GitHub PR number.
Call getPullRequestDetails(prNumber, owner, repo).
Log the results.
Detailed Example

// scripts/PullRequestFetch.js
require('dotenv').config();
const { getPullRequestDetails } = require('../src/services/GitHubService'); // adjust path

(async function testPullRequestFetch() {
  try {
    const prNumber = 42;  // example
    const owner = 'drjyounger';  // example from your code
    const repo = 'tempstars-app';  // or 'tempstars-api'
    
    console.log(`Fetching PR #${prNumber} from ${owner}/${repo} ...`);
    
    const result = await getPullRequestDetails(prNumber, owner, repo);
    console.log('Pull Request Fetch Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching PR:', error);
  }
})();
How to run:

node PullRequestFetch.js
You should see the PR title, description, and changed files if everything is correct.

3. FileConcatenate.js
Purpose
Test Step 3 logic alone—loading a local directory tree, letting you select files/folders, and then concatenating them into one file.

Important: Because your wizard step is built with React, you have to decide how to replicate the UI’s functionality. The minimal approach is to do everything in the terminal:

Prompt for a root directory path (or hard-code it).
Use your local file reading service (like readLocalDirectory or direct calls to /api/local/directory) to get the tree.
Render or log it in the terminal with some basic “selection” approach or simply pick a set of known files for this test.
Call your existing server endpoint (/api/concatenate-files) or the same underlying logic (concatenateFiles from FileService.ts).
Print the final concatenated text.
Detailed Example (Simple Approach)

// scripts/FileConcatenate.js
require('dotenv').config();
const inquirer = require('inquirer'); 
// inquirer (npm i inquirer) allows you to ask questions in CLI

const { getDirectoryTree, concatenateFiles } = require('../src/services/FileService');

(async function testFileConcatenate() {
  try {
    // 1) Get rootPath from user input, or hard-code
    const { rootPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'rootPath',
        message: 'Enter the root directory path for test (e.g. /Users/you/YourProject):',
        default: process.cwd()  // just the current directory as default
      }
    ]);

    console.log('Fetching directory tree. This may take a moment...');
    
    // 2) Retrieve directory tree
    const dirTree = await getDirectoryTree(rootPath);
    console.log('Directory Tree (top level):', JSON.stringify(dirTree, null, 2));

    // For a real test, you might recursively list subfolders. 
    // But for simplicity, let's pick some known files or ask user again:
    const { filePaths } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePaths',
        message: 'Enter a comma-separated list of file paths to concatenate (relative or absolute):'
      }
    ]);

    // Convert user input into array
    const selectedFiles = filePaths.split(',').map(f => f.trim());

    // 3) Use the same logic as the server to get a big concatenated output
    console.log('Concatenating selected files...');
    const response = await concatenateFiles(selectedFiles, 'TestPRNumber'); 
    // second param is the PR number, though you might not use it

    if (response.success) {
      console.log('\n----- Concatenated Output Start -----\n');
      console.log(response.data);
      console.log('\n----- Concatenated Output End -----\n');
    } else {
      console.error('Failed to concatenate files:', response.error);
    }

  } catch (error) {
    console.error('Error in FileConcatenate script:', error);
  }
})();
How to run:

node FileConcatenate.js
You’ll see a prompt for a root path and then a second prompt for file paths to concatenate. This is a “basic CLI approach,” but it demonstrates how you’d test the logic without the React UI.

4. SubmitReview.js
Purpose
Test Step 5 logic alone—submitting data to the LLM (Gemini) endpoint to get back a code review.

Since your final wizard step calls /api/generate-review, you can:

Use the same code your final step uses (generateCodeReview from LLMService.ts).
Pass mock JiraTicket, mock GitHubPR, and a fake concatenated file, or real content from prior steps.
Log the LLM’s response.
Detailed Example

// scripts/SubmitReview.js
require('dotenv').config();
const { generateCodeReview } = require('../src/services/LLMService');

(async function testSubmitReview() {
  try {
    // Mock data or partial real data from your actual ticket & PR
    const mockJiraTicket = {
      key: 'PROJ-999',
      summary: 'Test summary',
      description: 'Testing LLM generation without the UI...',
      acceptanceCriteria: 'Demo acceptance criteria',
      linkedEpics: []
    };

    const mockGitHubPR = {
      title: 'Test PR Title',
      description: 'Description of changes for testing LLM code review logic',
      number: 123,
      repo: { owner: 'drjyounger', name: 'tempstars-app' },
      changedFiles: []
    };

    // Use some short text for testing
    const mockConcatenatedFiles = `
# File: example.js
\`\`\`js
console.log('Hello from the test script');
\`\`\`
`;

    const mockReferenceFiles = [
      'Some example context: Database Schema or coding standards text here...'
    ];

    console.log('Sending data to the LLM API...');
    const result = await generateCodeReview({
      jiraTicket: mockJiraTicket,
      githubPR: mockGitHubPR,
      concatenatedFiles: mockConcatenatedFiles,
      referenceFiles: mockReferenceFiles
    });

    if (result.success) {
      console.log('\nLLM Review Response:\n', result.data);
    } else {
      console.error('LLM Review Error:', result.error);
    }
  } catch (error) {
    console.error('Error in SubmitReview:', error);
  }
})();
How to run:

node SubmitReview.js
If your Gemini API environment variables are set and valid, you should see a review response. If not, you’ll get an error from Gemini or from your script.

Additional Tips
Separate .env for Scripts: If your React environment variables have the prefix REACT_APP_, you may rename or set them in .env so that your Node scripts see them as process.env.REACT_APP_....
Directory Paths: Watch out for relative paths (../src/services/...) since your scripts might live in a separate folder. Adjust accordingly.
Error Handling: You might see unhelpful error messages if your environment variables or tokens are missing. Add console logs to confirm.
Conclusion
By creating these four test scripts, you can run each step in isolation:

node JiraFetch.js → pulls a Jira ticket
node PullRequestFetch.js → pulls a GitHub PR
node FileConcatenate.js → fetches local directory structure & concatenates chosen files
node SubmitReview.js → hits your LLM service with mock or real data
This setup will help debug more quickly without going through the entire React-based wizard. Just be mindful of environment variable consistency and the correct import paths to your existing service functions. Once these are operational, you’ll know each piece is stable—making the final wizard flow more reliable.