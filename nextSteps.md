Below is a step-by-step plan to integrate your real Gemini LLM (the “Flash” model) into this codebase so that the entire wizard flow ends with an actual AI-generated code review. The plan follows your existing structure and the requirements from .cursorrules—namely, that:

You fetch Jira + GitHub info.
You gather local files + references.
You compile them into a single prompt for the LLM.
You display the returned code review in the last step.
1. PREPARE ENVIRONMENT & CREDENTIALS
Obtain Gemini API Key / Credentials

Ensure you have your Gemini “Flash” model key (often in an environment variable) — for example:
env
Copy
REACT_APP_GEMINI_API_KEY=sk-...
REACT_APP_GEMINI_URL=https://your-gemini-endpoint.com/v1/invoke
If you don’t have the final endpoint, create a placeholder, e.g. https://gemini.google.com/flash for now.
Add This Key to .env

The create-react-app environment variables must begin with REACT_APP_.
Make sure you have REACT_APP_GEMINI_API_KEY and REACT_APP_GEMINI_URL in your .env file. Then in LLMService.ts you can do:

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = process.env.REACT_APP_GEMINI_URL;
Important: Do not commit sensitive keys to a public repo.
Install Any Required Dependencies

If Gemini has a Node library or you want to do a pure HTTP fetch, confirm you have everything you need. Currently, your code uses fetch in LLMService.ts, so that might be enough.
2. BUILD THE SYSTEM PROMPT WITH ALL CONTEXT
Use generateSystemPrompt() in src/prompts/systemPrompt.ts

You’ve already got a function that merges:
jiraTicket info
githubPR info
concatenatedFiles
referenceFiles
That function returns a big chunk of text that instructs your LLM on how to produce a code review.
Right now, you’re not actually using that inside LLMService.ts—you’re just sending these as separate fields. So we’ll fix that below.
In generateCodeReview() (see Step #3 below), call generateSystemPrompt(...) to produce one consolidated string prompt. Then you’ll pass that string to the Gemini model (Flash) as your “prompt.”

3. UPDATE YOUR REAL LLM CALL IN LLMService.ts
File: src/services/LLMService.ts
Inside generateCodeReview(...), you currently do:


export const generateCodeReview = async ({ jiraTicket, githubPR, concatenatedFiles, referenceFiles }) => {
  const response = await fetch('/api/generate-review', { ... });
  // ...
};
But that’s just calling your local mock endpoint (/api/generate-review in proxy.js). Instead, you want to call Gemini directly, or at least have proxy.js forward a real request to Gemini. Here are two approaches:

Approach A: Call Gemini Directly from the Client
Remove or bypass your proxy.js “generate-review” route.

Within generateCodeReview(), do something like:


import { generateSystemPrompt } from '../prompts/systemPrompt';

export const generateCodeReview = async ({
  jiraTicket,
  githubPR,
  concatenatedFiles,
  referenceFiles
}) => {
  // 1) Build a single text prompt
  const promptString = generateSystemPrompt({
    jiraTicket,
    githubPR,
    concatenatedFiles,
    additionalFiles: referenceFiles,
  });

  // 2) Send that prompt to Gemini
  const response = await fetch(process.env.REACT_APP_GEMINI_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // the exact request shape depends on Gemini's API
      prompt: promptString,
      model: 'flash', 
      temperature: 0.3
    })
  });

  if (!response.ok) {
    return { success: false, error: `Gemini error: ${response.statusText}` };
  }

  // 3) parse out the LLM's text
  const resultData = await response.json();
  // e.g. if Gemini returns { choices: [{ text: 'some answer' }] }:
  const text = resultData?.choices?.[0]?.text || '(No content)';

  return {
    success: true,
    data: text,
  };
};
Now your code calls the real LLM, returning the LLM’s text as data.

In your ReviewSubmissionStep.tsx:


const review = await generateCodeReview({
  jiraTicket,
  githubPR,
  concatenatedFiles,
  referenceFiles,
});

if (review.success) {
-   localStorage.setItem('reviewResult', JSON.stringify({ review: review.data, suggestions: [], score: 0 }));
+   localStorage.setItem(
+     'reviewResult',
+     JSON.stringify({
+       review: review.data,
+       suggestions: [],
+       score: 0
+     })
+   );
...
Done—the final step’s text is the real LLM response, not the local mock.

This approach yields a real code review from Gemini that has headings like:


1. SUMMARY
Some summary...
2. CRITICAL ISSUES
...
3. RECOMMENDATIONS
...
4. POSITIVE HIGHLIGHTS
...
5. DETAILED BREAKDOWN
...
So your Step6 parse logic will properly fill each category.

4. ENSURE THE LLM’S RESPONSE INCLUDES HEADINGS
Because your final step’s parseSections() function is keyed off:

1. SUMMARY
2. CRITICAL ISSUES
3. RECOMMENDATIONS
4. POSITIVE HIGHLIGHTS
5. DETAILED BREAKDOWN
You must instruct Gemini to produce that structure. You’re doing so in systemPrompt.ts:


Please provide your review in the following structure:

1. SUMMARY
Brief overview...
2. CRITICAL ISSUES
Any blocking issues...
3. RECOMMENDATIONS
...
4. POSITIVE HIGHLIGHTS
...
5. DETAILED BREAKDOWN
...
As long as Gemini adheres to that format, you’ll see the sections fill in.

5. OPTIONAL: EXTEND / TWEAK THE PROMPT
If you want the final text to also incorporate a “score” or “suggestions,” you can instruct the LLM. For instance, in systemPrompt.ts, add:


Additionally, provide a numeric code quality score from 0 to 100.
Then parse it in your front-end if desired.

6. VERIFY THE Cursorrules Acceptance Criteria
From .cursorrules, the wizard must:

Gather Jira ticket info 
Gather GitHub PR info 
Let user pick local files 
Concatenate the selected files into a single text
Let user optionally pick additional reference docs
Submits everything to LLM 
Confirm we build the final prompt with all the bits
Confirm we add the actual LLM call to Gemini.
Show final review → your Step6ReviewResults currently looks for headings in the text. 
