AI Coding Assistant
A multi-step wizard that pulls Jira tickets, allows you to select and concatenate relevant local files, optionally include additional references, and then submits all of that data to an LLM (Gemini) for a detailed implementation guide on how to fulfill those Jira tickets.

Table of Contents
Overview
Key Features
Tech Stack
Project Structure
Installation & Setup
Environment Variables
How to Run
Wizard Workflow
Troubleshooting
Additional Notes
1. Overview
This AI Coding Assistant tool helps a beginner (or any) developer gather all relevant context for one or more Jira tickets, including:

Jira ticket details (multiple tickets allowed, separated by commas).
Concatenated local files (via a checkbox-based directory tree).
Optional reference files (coding standards, DB schema, business context).
Generates a final system prompt that is sent to a Large Language Model (Google Gemini).
The LLM responds with a detailed, step-by-step plan to implement the Jira tickets—making sure it covers code changes, new files, acceptance criteria, and everything else.

2. Key Features
Fetch Multiple Jira Tickets:
You can enter multiple Jira ticket numbers separated by commas. Each ticket is fetched from Jira’s REST API and stored locally.

Local File Tree & Concatenation:

Enter a root path.
Display the subdirectories/files using rc-tree.
Check the boxes for relevant files/folders.
The system concatenates only text-based files (e.g., .ts, .js, .md, etc.) into a single Markdown document.
Optional References:

Include “Design & Coding Standards,” “Database Schema,” “Business Context,” etc.
Pulled from local JS files in src/references/.
LLM Submission:

All data is combined into a final system prompt (see systemPrompt.js) and sent to Google Gemini.
Returns a detailed action plan for how to implement the Jira tickets.
Detailed Implementation Plan:

The LLM message includes sections: Summary, Affected Files, Detailed Instructions, Acceptance Criteria Checklist, etc.
3. Tech Stack
React (TypeScript) front end
Node.js + Express server on localhost:3001
rc-tree for recursive file exploration
Axios / Octokit for calling external APIs (e.g., Jira, GitHub if needed)
Gemini LLM from Google’s “generativelanguage.googleapis.com”
4. Project Structure
Here’s a simplified directory overview:

kotlin
Copy
CodingAssistantAssistant2/
├── .cursorrules
├── README.md             <-- (Add this readme here if desired)
├── package.json
├── tsconfig.json
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── types/ 
│   ├── references/
│   ├── server/
│   │   ├── proxy.js        <-- Node/Express server
│   │   ├── package.json
│   ├── utils/
│   │   ├── fileFormatter.ts
│   │   ├── storage.ts
│   │   └── ...
│   ├── components/
│   │   ├── FileTree.tsx
│   │   └── Steps/
│   │       ├── JiraTicketStep.tsx
│   │       ├── FileSelectionStep.tsx
│   │       ├── AdditionalFilesStep.tsx
│   │       ├── ReviewSubmissionStep.tsx
│   │       └── Step6ReviewResults.tsx
│   ├── prompts/
│   │   └── systemPrompt.js
│   ├── services/
│   │   ├── JiraService.ts
│   │   ├── LLMService.js
│   │   └── ...
│   └── ...
└── ...
Notable Files:

src/server/proxy.js: Express server endpoints to

Read local directories/files.
Call Jira.
Proxy the final request to the LLM.
src/components/Steps/...: Each step of the wizard.

src/prompts/systemPrompt.js: The system prompt used to craft the final instructions to the LLM.

src/services/LLMService.js: Where the actual call to Google Gemini LLM is made.

5. Installation & Setup
Clone or Download this repository.

Install Node.js (v16+ recommended).

Install Dependencies:

bash
Copy
# from project root
npm install

# also install server dependencies if you have a separate /server/package.json
cd src/server
npm install

# Then go back to root:
cd ../../
6. Environment Variables
Create a .env file in the project root (or set them in your environment). You might need variables like:

makefile
Copy
# Jira
REACT_APP_JIRA_API_URL=https://yourcompany.atlassian.net
REACT_APP_JIRA_EMAIL=some-user@example.com
REACT_APP_JIRA_API_TOKEN=xxxxxxx

# Gemini LLM
REACT_APP_GEMINI_API_KEY=xxxxx

# Optional: GitHub (not mandatory if you're not fetching PR info)
REACT_APP_GITHUB_TOKEN=xxxxx

# Server
REACT_APP_SERVER_PORT=3001
PORT=3001
Check that proxy.js references REACT_APP_JIRA_API_URL, etc. Adjust as needed.

7. How to Run
Local Development:

Start the Node Server (on port 3001 by default):
bash
Copy
cd src/server
node proxy.js
Start React (on port 3000 by default):
bash
Copy
cd ../../
npm start
Open http://localhost:3000 in your browser.
If everything is correct, you’ll see the wizard starting at Step 1 (Jira Ticket).

8. Wizard Workflow
Step 1: Jira Ticket

Enter one or more comma-separated Jira ticket IDs (e.g. PROJ-123, PROJ-124).
Click “Fetch Tickets.” This calls JiraService.ts → your Express server → Jira API.
If successful, it shows the fetched tickets. Click “Next.”
Step 2: (Optional)

If your code references GitHub PRs, you can fetch them. But in this project, that step may be omitted or simplified.
Step 3: File Selection

Enter a root directory (absolute path on your local machine).
Click “Fetch Directory.”
A tree view appears with checkboxes for each subdirectory/file.
Check everything relevant to the ticket’s context.
The system automatically filters out non-text files.
Press “Concatenate Files” to generate a single markdown doc from those text files. You’ll see a preview.
Press “Next.”
Step 4: Additional Files

You can optionally include reference materials: coding standards, DB schema, business context, etc.
Select which references to include in the final prompt.
Press “Next.”
Step 5: Review Submission

This final step collects your Jira tickets, concatenated code, and references into one prompt.
Click “Submit Review” → calls the LLM (Gemini).
Wait for a detailed plan.
Step 6: Results

The code returns a structured, step-by-step plan for implementing the Jira tickets:
Summary, Affected Files, Instruction Guide, Acceptance Criteria, etc.
9. Troubleshooting
Jira Requests Failing

Ensure REACT_APP_JIRA_API_URL, REACT_APP_JIRA_API_TOKEN, and REACT_APP_JIRA_EMAIL are correct.
Check your .env and confirm the server logs aren’t throwing “Missing environment variables.”
Local File Selection Not Working

Make sure you typed the correct absolute path. The server might block certain paths (like .ssh, etc.).
Check proxy.js to see if there are any path checks.
Gemini LLM Errors

If you see “Gemini API error: Unauthorized,” check REACT_APP_GEMINI_API_KEY in .env.
The LLM code in LLMService.js references that key via process.env.REACT_APP_GEMINI_API_KEY.
Large or Nested Directories

The code fetches directories recursively. If your folder is huge, it might be slow.
You can skip large folders like node_modules.
No Detailed Sections in LLM Response

The code expects certain section headers. If the response is incomplete, check the logs or .env variables. Possibly the LLM truncated or an error occurred.
10. Additional Notes
Security:
By default, this tool is for local use. If you host it publicly, tighten path checks in proxy.js.

Performance:
The entire file tree is loaded in memory. For enormous projects, consider partial or on-demand loading.

Customizing the Prompt:

Edit src/prompts/systemPrompt.js to change the final instructions or required sections.
For example, to add a new section like “6. Testing Strategy,” just add it to the template.
Further Enhancements:

You could add advanced filtering, e.g., only show .ts or .js files.
If the final concatenated file is extremely large, you may consider chunking or advanced LLM strategies.
That’s it! You have a project that fetches Jira tickets, selects/concatenates local code, includes reference files, and sends it all to Gemini for a detailed, step-by-step coding plan.

Feel free to open issues, tweak code, or extend features as needed.

Enjoy using the AI Coding Assistant!