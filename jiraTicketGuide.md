# Guide to Writing AI-Optimized Jira Tickets

## Introduction

This guide provides best practices for creating Jira tickets that are optimized for AI coding assistants rather than human developers. While humans rely on implicit knowledge, context, and can clarify ambiguities through conversation, AI systems require explicit, structured, and comprehensive information to generate accurate code implementations.

## Core Principles for AI-Optimized Tickets

1. **Explicit over Implicit** - State everything clearly; avoid assumptions
2. **Structured over Freeform** - Use consistent sections and formatting
3. **Specific over General** - Provide exact technical details and requirements
4. **Complete over Concise** - Include all relevant information in one place
5. **Example-Rich over Abstract** - Provide code samples, input/output examples

## Essential Sections for AI-Optimized Tickets

### 1. Title
- **DO**: Use a clear, technical, action-oriented title
- **DON'T**: Use vague, project-management oriented titles
- **Example**:
  - ✅ "Implement JWT authentication middleware for API endpoints"
  - ❌ "Add security to the backend"

### 2. Technical Description

- **DO**: 
  - Start with a 1-2 sentence technical summary
  - Describe the component's purpose and how it integrates with other components
  - Reference specific technologies, libraries, patterns, or algorithms to use
  - Include technical constraints (performance, security, etc.)
  
- **DON'T**:
  - Use business jargon without technical explanation
  - Assume the AI knows the codebase structure (explicitly mention it)
  - Skip mentioning technical constraints or requirements

- **Example**:
```
Implement a JWT authentication middleware function for Express.js API endpoints. 
This middleware should verify a JWT token in the Authorization header, extract the user ID, 
and attach the user object to the request for downstream route handlers. 
The middleware should use the existing User model to fetch user data.

Technical constraints:
- Token verification must use the RS256 algorithm
- Failed authentication should return 401 status with appropriate error message
- Performance: User lookup should be cached with 5-minute TTL
```

### 3. File Paths and Code Locations

- **DO**:
  - Specify exact file paths where changes are needed
  - Mention which functions/classes/methods need modification
  - Describe where new files should be created
  
- **DON'T**:
  - Assume the AI knows where components are located
  - Use vague references to code areas
  
- **Example**:
```
Files to be modified:
- src/middleware/auth.js - Create new file
- src/routes/api.js - Import and apply the middleware
- src/config/auth.js - Add JWT verification settings

The middleware should be applied to all routes in src/routes/api.js except for 
the /api/login and /api/register endpoints.
```

### 4. Input/Output Specifications

- **DO**:
  - Define exact input parameters with types and formats
  - Specify expected output/return values with formats
  - Include error handling expectations
  
- **DON'T**:
  - Assume parameter formats are obvious
  - Skip error condition handling
  
- **Example**:
```
Inputs:
- req: Express request object
- res: Express response object
- next: Express next function

JWT Token format:
- Format: Bearer {token}
- Header: Authorization
- Payload must contain: { userId: string, role: string, exp: number }

Outputs:
- On success: Calls next() with req.user populated with user data
- On missing token: Returns 401 with { error: "Authentication required" }
- On invalid token: Returns 401 with { error: "Invalid or expired token" }
- On user not found: Returns 404 with { error: "User not found" }
```

### 5. Detailed Acceptance Criteria

- **DO**:
  - List criteria as testable statements
  - Include positive and negative test cases
  - Specify edge cases explicitly
  - Provide expected behavior for all scenarios
  
- **DON'T**:
  - Use subjective criteria ("should look nice")
  - Skip edge case handling
  
- **Example**:
```
Acceptance Criteria:
1. Valid JWT token in Authorization header successfully authenticates and populates req.user
2. Expired JWT token returns 401 with "Invalid or expired token" message
3. Missing Authorization header returns 401 with "Authentication required" message
4. Malformed JWT token returns 401 with "Invalid or expired token" message
5. Token with valid format but invalid signature returns 401
6. Valid token but non-existent userId returns 404
7. Request to excluded routes (/api/login, /api/register) passes through without authentication
8. User data is cached for 5 minutes to improve performance on subsequent requests
```

### 6. Code Examples and Pseudo-code

- **DO**:
  - Provide starter code or pseudo-code for complex logic
  - Include examples of expected function signatures
  - Show example usage in other components
  
- **DON'T**:
  - Assume the AI can derive complex implementations from vague descriptions
  
- **Example**:
```javascript
// Example implementation structure:
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    // 2. Verify token using JWT library and RS256 algorithm
    // 3. Extract userId from payload
    // 4. Check cache for user data
    // 5. If not in cache, fetch from database and cache
    // 6. Attach user to request object
    // 7. Call next()
  } catch (error) {
    // Handle different error types with appropriate responses
  }
};

// Example usage in API routes:
app.use('/api', authenticate);
app.use('/api/login', loginRouter); // No authentication
```

### 7. Dependencies and Related Tickets

- **DO**:
  - List all related Jira tickets
  - Specify dependencies on other components
  - Mention required libraries or external systems
  
- **DON'T**:
  - Assume relationships between tickets are obvious
  
- **Example**:
```
Dependencies:
- Requires JWT library (jsonwebtoken v8.5.1+)
- Depends on completion of JIRA-123 (User model implementation)
- Will be used by JIRA-456 (Protected API endpoints)

Required environment variables:
- JWT_PUBLIC_KEY: RSA public key for token verification
- TOKEN_EXPIRY: Token expiration time in seconds
```

### 8. Testing Instructions

- **DO**:
  - Provide specific testing scenarios
  - Include sample requests and expected responses
  - Specify how to set up test environment
  
- **DON'T**:
  - Assume testing approach is obvious
  
- **Example**:
```
Testing:
1. Unit tests should be added to tests/middleware/auth.test.js
2. Mock JWT tokens can be generated using the helper in tests/helpers/generateToken.js
3. Test with valid token, expired token, invalid signature, and missing token scenarios
4. Integration tests should verify caching behavior

Sample test token:
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature
```

## Common Pitfalls to Avoid

1. **Ambiguity**: Avoid terms like "appropriate," "reasonable," or "as needed" without defining them.

2. **Missing Context**: Don't assume the AI knows which design patterns your project follows or understands the project's architecture without explanation.

3. **Inconsistent Terminology**: Use consistent terms throughout the ticket; the AI may interpret slight variations as different concepts.

4. **Overloaded Requirements**: Split complex functionality into multiple tickets with clear dependencies rather than cramming everything into one ticket.

5. **Lack of Technical Specificity**: "Make it faster" is less useful than "Optimize the database query to complete in under 300ms by adding an index on the timestamp column."

## Jira Ticket Template

```
Title: [Specific technical task description]

Technical Description:
[1-2 sentence summary]
[Component purpose and integration points]
[Technical approach, libraries, patterns]
[Technical constraints]

File Paths and Code Locations:
- [File path 1] - [Create/Modify/Delete]
- [File path 2] - [Create/Modify/Delete]
[Details about where code changes should occur]

Input/Output Specifications:
[Input parameters with types and formats]
[Expected output/return values]
[Error handling expectations]

Acceptance Criteria:
1. [Testable criterion 1]
2. [Testable criterion 2]
3. [Testable criterion 3]
...

Code Examples:
```code
[Pseudo-code or example code]
```

Dependencies and Related Tickets:
- Requires: [libraries, tickets, components]
- Blocked by: [dependencies]
- Blocks: [dependent tickets]

Testing Instructions:
[Testing approach]
[Sample test data]
[Expected outcomes]
```

## Comparison: Human vs. AI-Optimized Tickets

### Human-Oriented Ticket:
```
Title: Add user authentication

Description:
We need to add authentication to our API endpoints to secure them.
Only logged-in users should be able to access protected endpoints.

Acceptance Criteria:
- Users can log in
- Protected endpoints are secure
- Invalid logins are rejected
```

### AI-Optimized Ticket:
```
Title: Implement JWT authentication middleware for Express API endpoints

Technical Description:
Create an Express.js middleware function that verifies JWT tokens provided in 
the Authorization header. The middleware should extract the user ID from the 
token, fetch the corresponding user from the database, and attach the user 
object to the request for use by downstream route handlers.

File Paths and Code Locations:
- src/middleware/auth.js - Create new file
- src/routes/api.js - Import and apply the middleware
- src/config/auth.js - Add JWT configuration

Input/Output Specifications:
- Token Format: Bearer {jwt_token}
- Token Payload: { userId: string, role: string, exp: number }
- Success: Calls next() with req.user populated
- Failure: Returns appropriate HTTP 401/404 responses

Acceptance Criteria:
1. Valid JWT token successfully authenticates and attaches user data
2. Expired/invalid tokens return 401 with appropriate error message
3. Missing token returns 401 with "Authentication required" message
4. Token with valid format but non-existent userId returns 404
5. Protected routes reject unauthenticated requests
6. Public routes remain accessible without authentication

Code Example:
```javascript
// Expected middleware usage
app.use('/api/protected', authenticate);
app.use('/api/public', publicRoutes);
```

Dependencies:
- Requires jsonwebtoken library v8.5.1+
- Depends on User model implementation (JIRA-123)

Testing Instructions:
- Unit test with valid, expired, and invalid tokens
- Integration test with protected and public routes
```

## Conclusion

Creating AI-optimized Jira tickets requires more upfront detail and explicit information compared to tickets written for human developers. However, this investment pays off through more accurate code implementation, fewer revision cycles, and higher success rates from the AI coding assistant. Remember that AI cannot read between the lines or understand implied requirements, so being explicit, specific, and comprehensive is essential for success.
