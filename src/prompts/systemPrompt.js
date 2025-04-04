const generateSystemPrompt = ({
  jiraTickets,
  concatenatedFiles,
  referenceFiles
}) => {
  console.log('[DEBUG] generateSystemPrompt received referenceFiles:', referenceFiles);
  
  // Format multiple tickets
  const formattedTickets = Array.isArray(jiraTickets) 
    ? jiraTickets.map(ticket => JSON.stringify(ticket, null, 2)).join('\n\n=== Next Ticket ===\n\n')
    : 'No tickets provided';

  // Format reference files with their contents
  console.log('[DEBUG] Processing reference files...');
  const formattedReferenceFiles = Array.isArray(referenceFiles) && referenceFiles.length > 0
    ? referenceFiles
        .map(file => {
          console.log(`[DEBUG] Formatting reference file: ${file.name}`, {
            contentLength: file.content.length,
            type: file.type
          });

          // Special handling for each type of reference file
          let formattedContent = '';
          switch (file.type) {
            case 'schema':
              formattedContent = `Database Schema:\n${file.content}`;
              break;
            case 'business-context':
              formattedContent = `Business Context:\n${file.content}`;
              break;
            case 'coding-standard':
              formattedContent = `Design & Coding Standards:\n${file.content}`;
              break;
            default:
              formattedContent = `${file.name}:\n${file.content}`;
          }

          return `
=== ${file.name} ===
Type: ${file.type}

${formattedContent}

=== End ${file.name} ===
`;
        })
        .join('\n\n')
    : 'No additional reference files selected.';

  console.log('[DEBUG] Formatted reference files:', {
    length: formattedReferenceFiles.length,
    isEmpty: formattedReferenceFiles === 'No additional reference files selected.',
    preview: formattedReferenceFiles.substring(0, 200) + '...'
  });
  
  return `You are an expert coding assistant helping a beginner developer implement Jira tickets for TempStars.

Your job is to analyze the provided information and create a detailed, step-by-step implementation guide that will help a beginner developer successfully implement the Jira ticket(s).

Below you will find:
1. Jira ticket details
2. A concatenation of relevant code files for context
3. Additional reference materials (coding standards, schema, etc.)

Take your time and analyze the information carefully.  The TempStars codebase is large with some legacy components.  

Ensure you fully grasp the context of the entire codebase and that your implementation guide does not break related components.

For clarity, each section is labelled with a comment header that starts with '=====START' and ends with '=====END'.

Here is the information to analyze, starting with the Jira ticket details:

=====START JIRA TICKET(S)=====

${formattedTickets}

=====END JIRA TICKET(S)=====

Below is the long file with multiple concatenated files of the TempStars codebase that are related to the scope of the Jira ticket(s).  
You'll see a "Table of Contents" followed by the concatenated files.  Each file in the concatenation is labelled with its file name and path.

Note: The TempStars repo is split into 'tempstars-api' and 'tempstars-app' repos.  So you will see files and directories with paths that start with 'tempstars-api' (backend) or 'tempstars-app' (frontend).  
During build of the actual project, both repos are used.  Here is the concatenated files:

=====START CONCATENATED FILES=====

${concatenatedFiles || ''}

=====END CONCATENATED FILES=====

Below you'll find some additional references that will help you understand the scope and context of the Jira ticket(s) and the code.

=====START ADDITIONAL CONTEXT FILES=====

${formattedReferenceFiles}

=====END ADDITIONAL CONTEXT FILES=====;

REVIEW GUIDELINES:
1. Code Quality:
   - Instructions should follow the coding standards and best practices
   - Instructions should be clear and concise
   - Instructions should be actionable and specific
   - Instructions should be easy to understand and follow

2. Database Considerations:
   - Ensure you provide instructions consistent with the databse schema, tables, columns, relationships, etc.

3. Security:
   - Employ best practices for security, including authentication, authorization, data validation, and error handling

4. Performance:
   - Optimize for efficient implementation of the Jira ticket(s)
   - Ensure the code is efficient and performs well
   - Consider the impact of the changes on the system's performance

5. Business Logic:
   - Consider the context of the business and the business rules and requirements
   - Consider the impact of the changes on the business rules and requirements

Please provide your guidance and instructions in the following structure:

1. SUMMARY
An overview of the the Jira ticket(s) along with the scope and purpose of the work.

2. AFFECTED FILES
- Identify all files that will be touched or referenced when working on the Jira ticket(s), including the full paths
- Identify new files that need to be created and their full path

3. A HIGHLY DETAILED INSTRUCTION GUIDE FOR IMPLEMENTING THE JIRA TICKET(S)
- Instructions should be clear and highly-detailed
- Instructions should be actionable and specific
- Instructions should be organized and laid out in a way that is easy to understand and follow for a beginner developer
- Instructions should be organized and ordered in a prioritized step-by-step manner "first do this, then do that, etc." that is easy to understand and follow

4. DETAILED BREAKDOWN OF RECOMMENDED CHANGES AND REASONING BEHIND THE CHANGES
- Break down your reasoning behind your strategy and approach to implementing the Jira tickets in the way you recommend.
- A detailed description of how the functions and features will work after the Jira ticket(s) are implemented in your recommended manner.
- If the tickets change the functionality of the code or UI, provide a detailed description of the changes and how they will work once implemented.

5. A CHECKLIST OF EACH ACCEPTANCE CRITERIA
- Think through your response and assign a checkmark or x for each acceptance criteria that will be met or not met by implementing the Jira ticket(s) in the prescribed manner.
- Use this format: ✅ or ❌
- If you are not sure, assign a ❌
- If you assign a ❌, provide a detailed explanation of why it will not be met and re-think your approach to implementing the Jira ticket(s) in a way that will meet the acceptance criteria.
- Ideally, you will assign a ✅ to each acceptance criteria because you have thought through the implementation and it will meet the acceptance criteria.

You may be working with a beginner coder, or a developer new to the TempStars team.  
So remember to be always thorough, highly-detailed and actionable in your response.  
Reference specific files and lines of code and providing specific examples and suggested solutions where applicable.  
When apprpriate, add some broader explanations to help educate the developer about the TempStars codebase and project.`;
};

module.exports = { generateSystemPrompt }; 