/**
 * @typedef {Object} ReferenceFile
 * @property {string} name
 * @property {string} type
 * @property {string} content
 */

/**
 * @typedef {Object} DesignImage
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} size
 * @property {string} url
 * @property {string} [preview]
 */

/**
 * @typedef {Object} UploadedVideo
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} size
 * @property {string} url
 * @property {string} preview
 * @property {number} [duration]
 */

/**
 * Generates the system prompt for the AI model
 * @param {Object} params
 * @param {Array} params.jiraTickets - Jira ticket information
 * @param {string} params.concatenatedFiles - Concatenated source code files
 * @param {Array} params.referenceFiles - Additional reference files
 * @param {DesignImage[]} [params.designImages=[]] - Design image information
 * @param {UploadedVideo[]} [params.uploadedVideos=[]] - Uploaded video information
 * @returns {string} The formatted system prompt
 */
const generateSystemPrompt = ({
  jiraTickets,
  concatenatedFiles,
  referenceFiles,
  designImages = [],
  uploadedVideos = []
}) => {
  console.log('[DEBUG] generateSystemPrompt received referenceFiles:', referenceFiles);
  console.log('[DEBUG] generateSystemPrompt received designImages:', designImages);
  console.log('[DEBUG] generateSystemPrompt received uploadedVideos:', uploadedVideos);
  
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

  // Format design images information
  console.log('[DEBUG] Processing design images...');
  const formattedDesignImages = Array.isArray(designImages) && designImages.length > 0
    ? designImages
        .map((image, index) => `Image ${index + 1}: ${image.name} (${image.type})`)
        .join('\n')
    : 'No design screenshots provided.';

  // Format uploaded videos information
  console.log('[DEBUG] Processing uploaded videos...');
  const formattedVideos = Array.isArray(uploadedVideos) && uploadedVideos.length > 0
    ? uploadedVideos
        .map((video, index) => {
          const duration = video.duration 
            ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`
            : 'unknown duration';
          return `Video ${index + 1}: ${video.name} (${video.type}, ${duration})`;
        })
        .join('\n')
    : 'No explanation videos provided.';

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
3. Additional reference materials (coding standards, schema, business context, screenshots, etc.)
4. Design screenshots for visual implementation guidance
5. Explanation videos describing implementation details

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

=====END ADDITIONAL CONTEXT FILES=====

=====START DESIGN SCREENSHOTS=====

${formattedDesignImages}

Note: If provided, the actual design screenshots are included in this message as image attachments. Reference them when providing UI implementation instructions.

=====END DESIGN SCREENSHOTS=====

=====START EXPLANATION VIDEOS=====

${formattedVideos}

Note: If provided, the actual explanation videos are included in this message as video attachments. Watch them to understand the implementation requirements more clearly.

=====END EXPLANATION VIDEOS=====

Below for additional context is the business context and database schema for the TempStars platform:

=====START BUSINESS CONTEXT AND DATABASE SCHEMA=====

## TempStars SQL Database and Schema

# TempStars Platform Overview

## Overview
TempStars is a digital two-sided marketplace platform (web and mobile) that connects **dental offices** ("Demand") with **dental professionals** ("Talent" or "Supply") for both **temping** and **hiring** in North America. The platform provides an efficient and transparent way for dental offices to find temporary dental professionals quickly and easily.

## Business Logic

### Key Value Propositions

#### 1. Temping Services
* Direct digital connections for Dental Hygienists and Dental Assistants looking for flexible shift work.
* Allows Dental Offices to quickly find and book qualified professionals.

#### 2. Job Board (Permanent & Contract Roles)
* Dental offices can post long-term or permanent job openings for *any* dental role (Hygienists, Assistants, Admin, Office Managers, Associate Dentists).
* Dental professionals can search and apply to these open positions.

### 3. Revenue Model

#### Temping Shift Fees
* **Canada**: TempStars charges dental offices $73 (plus HST) for each completed temping shift.
* **United States**: TempStars charges dental offices $38 for each completed temping shift.

#### Job Board Fees
* **Posting a job**: Free for dental offices to post.
* **Viewing Applicant Details**: $18 to unlock the full contact details and resume of each applicant using a resume viewing 'token-based' system.

#### Payment Processing Fee (Optional)
* After a completed temping shift, a dental professional can use TempStars invoicing feature to create and send an invoice to the dental office. When this is done, the dental office has the option to use "Pay Now" to pay the Talent.
* TempStars then charges the dental office's credit card the amount of the Talent's invoice and forwards payment to the Talent.
* **TempStars Fee (revenue)**: 4.75% added as a convenience and processing fee (covers credit card fees plus a small margin).

### Core Services

#### Temping Service
Works like "Uber for dental temping" - facilitating one-day temping "Shifts" where dental offices need temporary coverage. For this service:
- Dental offices post a "Shift"
- Talent (restricted to dental hygienists and dental assistants) send in "Offers" at their preferred "hourly rate"
- Quick, short-term connections are made for immediate staffing needs

#### Job Board Service
Functions similar to Indeed or Classified Ads for permanent or contract positions. For this service:
- Dental offices post a "Job" 
- Talent (including hygienists, assistants, office managers, admin staff, and associate dentists) apply as candidates
- Longer-term employment relationships are formed

## Temping Process Overview

When a dental office needs a temporary professional, they post a shift. A "shift" and a "job" can be used interchangeably, but in practice, "job" often refers to a permanent opening in the job board, while "shift" is for temp work for the temping service.

### Shift Posting
* Dental office posts shift details: date, time, role, preferred hourly rate, any special requests.
* (Optional) "Auto-Book" or "Instabook" features for quick booking of top-rated professionals.

### Shift Browsing
* Dental professionals (hygienists/assistants) browse available shifts through the app or web platform, using filters and the system ensures only qualified Talent view shifts that are a match for them.

### Offer Submission
* Professionals submit an offer to work, possibly customizing their hourly rate (via a rate selector).

### Offer Review & Booking
* Dental offices see offers (including professional's resume, graduation year, rating score, offered rate) and either accept or decline.
* Upon acceptance, both parties receive confirmation emails/notifications.

### Shift Execution
* Professional arrives on the scheduled day, performs the shift, and upholds professional standards.

### Invoicing & Payment
* Professional generates an invoice through TempStars or via personal means.
* Office pays through TempStars' payment platform (optional) or through another method (e.g., the office can pay talent themselves directly via e-transfer, check).

### Reviews
* After each shift, both parties leave a rating/review "How happy were you with this connection?".
* Ratings are simplified into three categories: "Favourite" (5-star), "Happy" (~4.2-star), or "Unhappy" (2-star).

### "Gardener" Algorithm
* Manages professional statuses (e.g., Pro, Elite, Probation, Revoked) based on reliability, feedback, and overall performance.
* May require remedial courses for those falling below reliability standards.

## Hiring Process via Job Board

### Job Posting
* Dental office logs in and posts a permanent or contract position (role, contract length, salary, benefits). This job board service works similar to online classified ads, customized for dentistry.

### Candidate Applications
* Dental professionals see listings and apply, providing resume/qualifications.

### Contact Info Unlock
* The dental office pays $18 to purchase a token that allows access the applicant's full information (contact details, resume).

### Interview & Hiring
* TempStars does not manage the full funnel of interview scheduling, but offices and candidates communicate directly once contact info is unlocked.

## User Journeys

### Demand Side (Dental Offices)

#### Awareness & Sign-up
* Offices discover TempStars via word-of-mouth, digital marketing, trade shows, email campaigns, channel partners.
* Create account with office details, location, payment method (credit card), compliance steps, etc.

#### Posting a Shift
* Enter shift details: date, time, hourly rate, type of role needed. Optionally enable Instabook or Auto-Book.

#### Receiving Offers & Booking
* Review the offers, possibly negotiate or decline with a reason.

#### Shift Day & Payment
* Expect the professional to arrive on time; handle any disputes through TempStars support.
* Pay by "Pay Now" or an alternative method.

#### Review & Retention
* Rate the professional after the shift.
* No formal loyalty or retention program is currently in place.

### Supply Side (Dental Professionals)

#### Discovery & Sign-up
* Register through TempStars website or app; provide email, role, location, qualifications.

#### Shift Browsing & Offers
* Browse shifts that match location, date, pay range.
* Submit an offer with a desired rate (or accept the listed rate).

#### Await Response
* Dental office can accept or decline. Some offices may make a counter-offer.

#### Executing the Shift
* Arrive on time, maintain professional standards, be ready for potential staff meetings or safety protocols.

#### Invoicing & Payment
* Generate invoice in-app or externally.
* If using TempStars' "Pay Now," the platform processes payment and deposits funds, minus any relevant fees.

#### Review & Continuous Engagement
* Rate the dental office; keep looking for additional shifts or permanent roles.

### Technical Environment
TempStars operates on an AWS instance of RDS SQL database running SQL Engine version 5.7.38. The database does not support 'with' statements (Common Table Expressions), so all queries need to be compatible with SQL Engine version 5.7.38.

The following sections describe the database tables, their columns, and relationships that form the foundation of the TempStars platform.

**<span style="text-decoration:underline;">“Hygienist” Table</span>**

**Description**: Stores information about Talent records (ie. dental hygienists, dental assistants, dental office managers, dental admin and associate dentists).   \
 \
Note:  There is no email column in this table.  Talent emails are stored in the User table.  To retrieve Talent email addresses, it’s User.email JOINING User ON User.hygienistId = Hygienist.id) \


**Columns**:

	•	id (int): The ID of the Talent.

	•	firstName (varchar): The first name of the Talent.

	•	lastName (varchar): The last name of the Talent.

	•	type (int): Differentiates between dental hygienists (0) and dental assistants (1) and dental admin (2) and associate dentists (3).

	•	createdOn (datetime): This is the date that the Talent registered with TempStars. “NULL” if the registration process was not completed.

	•	city (varchar): The city where the Talent lives.

	•	province (varchar): The province or state where the Talent lives.

	•	postalCode (varchar): Indicates the Postal Code (in Canada) or Zip Code (in United States) where theTalent lives.

	•	country (int): Indicates the country in which the Talent lives (0 = Canada, 1 = United States)

	•	graduationYear (int): The year when theTalent graduated from their professional school.

•	about (varchar): This is a self-written ‘about me’ section that Talent write for their profiles, similar to a short cover letter.

	•	status (int): Differentiates between membership status for Talent. (-3: “Blacklisted” means no access to Job Board or temping, -2: “Blocked” means access to Job Board but no access to temping, -1: “Probation” means Talent can only book one shift at a time, 0: “Active” means Talent has full access to temping and Job Board, 1: “Pro” means tTalent has attained a level of great reliability and professionalism and positive feedback with between 5 and 10 temping shifts completed, 2: “Elite” means Talent has attained an exceptional level of professionalism, reliability and positive feedback with more than 10 shifts completed.

	•	lat(varchar) and lon(varchar): Indicates the latitude and longitude of where the Talent lives

•	stripeAccountId (varchar): The value in this field represents the unique ID for the Stripe Express account set up by the Talent.  This value IS NULL when the Talent has not yet registered for Stripe Express payouts.

•	isOrtho: Indicates the Talent is qualified to provide orthodontic treatment (1: is qualified, 0: is not qualified)

•	isRestorative: Indicates the Talent is qualified to provide restorative dental treatment (1: is qualified, 0: is not qualified)

•	isComplete: Indicates the Talent has completed signup registration (1: has completed sign-up)

•	isDupe (varchar): This column indicates if the Hygienist record is unique, or if the record is part of a “Duplicate Cluster”.  The value is “NULL” if the record is unique with no duplicates.  If the record is part of a Duplicate Cluster, this value will be “Main” or a number.  If “Main”, it means that record is the Main account of the Duplicate Cluster.  If the value is a number, that number is the Hygienist.id of the Main account for that duplicate cluster.  A number means this is not the Main account.

•	cancellationScore (float): This column is an aggregate scoring of the temping shift cancellations made by the Talent.  The score is calculated based on the number of cancellations and the relative timing of those cancellations to the start of the shift.  A shift that is cancelled close to the start time of the shift is worth a higher score than one that is cancelled a month away.  This score is the sum total points of all cancelled shifts.

**<span style="text-decoration:underline;">“Feedback” Table</span>**

**Description:** Dental offices have a rating and review form they fill out after a shift is completed.  This allows the dental office to assign star ratings to various attributes of the Talent during the shift.  All star ratings are on a 5-star scale. There are also text fields for details related to each category.

**Columns:**

	•	JobId (int): The ID of the temping shift associated with the feedback (ie. JOIN Job ON Job.id = Feedback.jobId)

	•	clinicalSkillsRating (int): The star rating score attributed to this Talent’s Clinical Skills for that shift, as assessed by the dental office.

	•	clinicalSkillsDetails (text): Comments made by the dental office about that  Talent’s Clinical Skills for that shift.

	•	professionalismRating (int): The star rating score attributed to this Talent’s Professionalism for that shift, as assessed by the dental office.

	•	professionalismDetails (text): Comments made by the dental office about that  Talent’s professionalism for that shift.

	•	communicationRating (int): The star rating score attributed to this Talent’s communication style and skills for that shift, as assessed by the dental office.

	•	communicationDetails (text): Comments made by the dental office about that  Talent’s communication style and skills for that shift.

	•	timeManagementRating (int): The star rating score attributed to this Talent’s Time Management for that shift, as assessed by the dental office.  Examples are punctuality and staying on schedule during the day.

	•	timeManagementDetails (text): Comments made by the dental office about that  Talent’s Time Management for that shift.

	•	rateSatisfactionRating (int): The star rating score attributed to how satisfied the dental office was regarding the Talent’s hourly rate.  For example, was their hourly rate sensibly aligned with their skill and experience.

	•	rateSatisfactionDetails (text): Comments made by the dental office about how satisfied they were to pay that hourly rate for the value of the work provided by the Talent.

	•	additionalFeedbackDetails (text): Additional information, context and details provided by the dental office about the Talent and how the shift went.

Note: The Feedback form also has a section that asks the dental office if they would like to a) designate the Talent as a Favourite, b) Block that Talent from viewing future shifts, or c) indicate they were just pleased with the Talent but don’t want to Favourite or Block.  The details of this response by the office are found in the Job.hygienistFeedback column, JOINED by Job.id ON Feedback.jobId. Job.hygienistFeedback = 2 for Blocked, Job.hygienistFeedback = 5 for Favourite, Job.hygienistFeedback = 4.2 for “pleased”.

**<span style="text-decoration:underline;">“Dentist” Table</span>**

**Description:** This is the ‘anchor’ table that links multiple Locations under one login account.  This column doesn’t track a lot of data, but it does track a registration timestamp and a timestamp of when the Dentist ID agreed to updated Terms of Service..

**Columns:**

	•	registerTimestamp (datetime): The timestamp of when the Dentist record was created

	•	newTermsSeenOn (datetime): The timestamp of when that Dentist account saw updated terms of service.

**<span style="text-decoration:underline;">“Location” Table</span>**

**Description:** Stores details of dental office Locations.  Remember that “Location” refers to a dental office location place of business, and is not the geographic location.  So in this context, “dental office” and “location” are used interchangeably.

**Columns**:

	•	id (int): The ID of the dental office location.

	•	practiceName (varchar): The name of the dental office location.

	•	city (varchar): The city where the dental office is located.

•	createdOn (datetime):  The date the Location signed up with TempStars

•	dentistId (int):  Some dentists have multiple locations, so the dentistId is the ‘anchor’ ID for a group of dental offices.  The dentistId would remain the same for multiple location ID’s that are owned by the same owner.  


	•	email (varchar):  The email of the Location

	•	phone (varchar):  The phone number of the Location

	•	province (varchar): The province or state where the dental office is located, using standard 2-letter abbreviations for states and provinces.

	•	postalCode (varchar): The postal code or zip code of the dental office.

	•	country (int): Indicates the country where the dental office is located (0 = Canada, 1 = United States)

	•	isCentralBooked (int): Indicates if the Location is part of a large dental corporation (aka a ‘DSO’) (0: Not corporate, 1: ‘Dentalcorp’ DSO Corporate location, 2: ‘123Dentist’ Corporate location).

	•	lat(varchar) and lon(varchar): Indicates the latitude and longitude of where the dental office is located.

	•	stripeCustomerId (varchar): If the dental office has entered payment information into their account the stripeCustomerId  the Stripe Account ID.  This value is NULL if the dental office has not entered payment information.

	•	defaultProposedRateHygienist (int): Indicates the default proposed hourly rate that the dental office pays Hygienists for temping shifts, can be altered at the time of posting.

	•	defaultProposedRateAssistant (int): Indicates the default proposed hourly rate that the dental office pays dental assistants for temping shifts, can be altered at the time of posting.

	•	ppeEndorsed (int): Indicates the number of times that Talent have indicated the office has PPE and Infection control standards that meet or exceed requirements.

	•	friendlyEndorsed (int): Indicates the number of times that Talent have indicated that the office is a friendly place to work.

•	equipEndorsed (int): Indicates the number of times that Talent have indicated the office has good tools and equipment.

•	vaxRequired (int): Indicates if the dental office has a policy in place that requires employees to be vaccinated against COVID. 

•	deactivated (int): A value of ‘1’ indicates this Location has been deactivated. 

**<span style="text-decoration:underline;">“Job” Table</span>**

**Description**: Stores information related to TempStars Temping shifts.  Stores information about  shifts that are posted by dental offices, and the details of the working connection if the shift is booked and/or completed by Talent.  Temping is only for dental hygienists and dental assistants.

**Columns:**

	•	status (int): The status of the shift (1: Posted, 2: Has one or more offers from Talent to work the shift  3: Booked with a Talent, 4:Completed, 5: Had received Talent offers but all offers expired, 6: Expired - the shift posting was active but went unfilled and was not completed by the startDate, 7: canceled or removed by the dental office).

	•	startDate (date): The actual date the shift is to be worked by Talent.  Formatting is YYYY-MM-DD. **Important note: ** Because Job.startDate is in the “YYYY-MM-DD” format, you often need to convert it to a different format (“YYYY-MM-DD hh:mm:ss”) for data analysis for other fields that use datetime, etc.

	•	locationId (int): The ID of the dental office Location that posted the temping shift.

	•	hygienistId (int): Indicates the ID of the Talent who is booked for the shift.  Has a value of ‘0’ of the shift is not booked. If the shift is booked, the value in this column is the ID of the Talent booked for the shift (0: not booked, >0: Talent is booked). 

	•	dentistRating (int): Review score given by the Talent about the dental office (Note: a value “0” value means the dental office was unrated by the Talent)

	•	hygienistRating (int): Review score given by the dental office about the Talent  (Note: “0” value means the Talent was unrated by the office).

	•	dentistBilled (int): Indicates whether TempStars placement fee was collected (0: not collected, 1: collected, 2: free placement credit was used) for a completed shift.

	•	hourlyRate (decimal): Indicates the hourly rate earned by the Talent working the shift (the value indicates dollars per hour).

	•	postedOn (datetime): Format ‘YY-MM-DD hh:mm:ss’,  Indicates when a temping shift was posted by the dental office to the TempStars temping service.

	•	type (int): Indicates if the shift requires a Hygienist (0) or Dental Assistant (1).

	•	bookedOn (datetime): Format ‘YY-MM-DD hh:mm:ss’, indicates the timestamp of when the temping shift was booked and confirmed between the dental office and the Talent.

	•	dentistPrivateNotes (varchar): Indicates any private feedback notes by the dental office made about the Talent who worked the shift

	•	hygienistPrivateNotes (varchar): Indicates any private feedback notes by the Talent made about the dental office where the shift was completed.

	•	paysW2 (int): For shifts posted in the United States, this column indicates the nature of the employment relationship between the dental office and the Talent.  ‘0’ means “1099”, ‘1’ means “W2”, ‘2’ means “Either”.

**<span style="text-decoration:underline;">“User” Table</span>**

**Description**: Stores user information, including email addresses.

**Columns:**

	•	email (varchar): The email of the user used for the account login credential  NOTE:  Do not use this field for dental office location emails.  When referencing dental office location emails, only use Location.email fields.  Do use this column for Talent emails by JOIN User.hygienistId = Hygienist.id.

	•	hygienistId (int): The ID of the Talent associated with the User record.

	•	dentistId (int): The ‘anchor’ ID created when the dental offices signs up.  This is NOT NULL if the User record is related to a dental office location.

	•	platform: Indicates the platform used for signing up (NULL means web, “Android” means Android, iOS means iPhone).

	•	referredBy (int): This column identifies the User.id of the user that referred the current user record to the platform.  For example:  If User.id ‘5678’ has a User.referredBy value of ‘1234’, then this means that User ‘5678’ was referred by User ‘1234’.

**<span style="text-decoration:underline;">“PartialOffer” Table</span>**

**Description:** Talent submit ‘Offers’ to work temping shifts posted by Dental Offices.  The PartialOffer  table stores details of offers made by Talent for those temping shifts.

**Columns:**

	•	jobId (int): The ID of the temping shift associated with the offer (ie. JOIN Job ON Job.id = PartialOffer.jobId)

	•	hygienistId (int): The ID of the Talent who sent the offer (ie. JOIN Hygienist ON Hygienist.id = PartialOffer.hygienistId)

	•	createdOn (datetime): The timestamp of when the offer was sent.

	•	hourlyRate (decimal): The hourly rate offered by the Talent for the shift.

	•	numViews (int): The number of times the offer was viewed by the dental office.  This field IS NULL if the offer has not been viewed.

	•	firstViewed (datetime): The timestamp of when the offer was first viewed by the dental office.

	•	lastViewed (datetime): The timestamp of the most recent viewing of the offer by the dental office

	•	status (int): Differentiates the status of the offer  (0: Sent, 1: Rejected by the dental office, 2: Accepted/Booked/Confirmed by the dental offices, 3: Expired - Talent offers expire 18hrs after being sent, 4: Removed by Talent)

	•	offeredStartTime (datetime): Talent have the ability to submit offers for a portion of the shift.  The offeredStartTime is the start time offered by the talent.  Most commonly the offeredStartTime is the same as the postedStartTime

	•	offeredEndTime (datetime): Similar to offeredStartTime, the offeredEndTime is the end time offered by the talent.  Most commonly the offeredStartTime is the same as the postedEndTime.

	•	modifiedOn (datetime): Talent can modify the hours of a shift offer, and this is the timestamp of when that is modified. .


**<span style="text-decoration:underline;">“DentistCancelled” Table</span>**

**Description**: Sometimes dental offices cancel a shift that is booked.  The DentistCancelled table tracks the details when dental offices cancel a shift.

**Columns**:

	•	jobId (int): The Job Id of the canceled shift (ie. JOIN Job ON Job.id = DentistCancelled.jobId)

	•	locationId (int): The ID of the location that canceled the shift (ie. JOIN Location ON Location.id = DentistCancelled.locationId)

	•	cancelTimeStamp (datetime): The timestamp of when the shift was canceled by the dental office.

	•	shortNotice (int): Indicates whether the cancellation was short notice, less than 24hrs before the shift was scheduled to start (0: not short notice, 1: was short notice).

	•	reason (varchar): The reason for the cancellation selected from a dropdown in the cancellation UI.

	•	details (varchar): When cancelling a shift, there is a text area for the dental office to enter details and reason about the cancellation.

**<span style="text-decoration:underline;">“Shift” Table</span>**

**Description**: This table provides additional information about the posted temping shift.

**Columns**:

	•	jobId (int): The Job Id of the shift (ie. JOIN Job ON Job.id = Shift.jobId)

	•	shiftDate (date): The date of the shift to be worked

	•	postedStart (datetime): The date and time of when the shift is scheduled to start.

	•	postedEnd (datetime): The date and time of when the shift is scheduled to end.

	•	autobook (int): Indicates if the shift was booked via the “autobook” feature (= 1 if booked via autobook)

<span style="text-decoration:underline;">"HygienistReliabilityScore" Table</span>
Description: This table contains data related to Talent reliability for temping shifts. The Reliability Score and associated values are determined by the number of shifts a Talent completes, the number of shifts they have cancelled, and the timing of those cancellations. A high reliability score indicates good performance, while a low score indicates poor performance. These values are updated as Talent completes shifts and when they cancel shifts.
Columns:
hygienistId (int): The ID of the Talent record. HygienistReliabilityScore.hygienistId <JOIN> Hygienist.id
cancellationScore (float): This column is an aggregate scoring of the temping shift cancellations made by the Talent. The score is calculated based on the number of cancellations and the relative timing of those cancellations to the start of the shift. A shift that is cancelled close to the start time is worth a higher score than one cancelled well in advance. Short-notice cancellations are worth more cancellation points, likewise cancelling a shift further ahead is lower points. Lower points are better and indicate a more reliable Talent. This score is the sum total points of all cancelled shifts.
overallReliability (float): A calculated value that takes into account the lifetime of the Talent with TempStars, using cancellationScore and the number of completed shifts in their history of working with TempStars.
recentReliability (float): A calculated value similar to 'overallReliability' but accounts only for the most recent 90 days of completed shifts and cancellations.
weightedReliability (float): A calculated weighted combination of 'recent' and 'overall' reliability, with more weighting given to more recent activities. The formula is [(0.3 * overallReliability) + (0.7 * recentReliability)] to give an overall weighted score, favoring the Talent's most recent shift reliability. weightedReliability is used to manage the Talent membership - rewarding high reliability and taking steps to protect from poor reliability.


**<span style="text-decoration:underline;">“HygienistCancelled” Table</span>**

**Description**: Sometimes Talent cancels a temping shift that is booked.  The HygienistCancelled table tracks the details when Talent cancels a temping shift.

**Columns:**

	•	jobId (int): The Job Id of the canceled shift (ie. JOIN Job ON Job.id = HygienistCancelled.jobId)

	•	cancelTimestamp (datetime): Indicates when the shift was canceled by the Talent.

	•	rebookedBy (int): Indicates whether the shift was successfully rebooked by another Talent to work the shift.  The value is ‘0’ if the shift was not rebooked, and if the value is >0, that value is the Hygienist ID of the talent that rebooked the shift.

	•	hygienistId (int): Indicates the ID of the Talent who canceled the shift (ie. JOIN Hygienist ON Hygienist.id = HygienistCancelled.hygienistId)

	•	reason (varchar): The reason for the cancellation as indicated by the Talent from a dropdown UI in the cancellation flow.

	•	details (varchar): There is a text area where the Talent can provide further details and reason about the cancellation.

	•	isGracePeriodCancellation(int): This indicates if the cancellation fell within the ‘grace period’.  The grace period means the shift was cancelled within 24hrs of booking and the shift start date is more than 30 days away.  Grace period cancellation do not affect reliability scores.  There are a maximum of 3 grace periods per year for a Talent.

**<span style="text-decoration:underline;">“BlockedDentist” Table</span>**

**Description:** Sometimes a Talent has such a bad experience working at a shift that they don’t want to see the dental office’s future shift postings.  This table tracks the details of that ‘blocking’.

**Columns:**

	•	locationId (int): The ID of the dental office that the Talent was unhappy with (ie. JOIN Location ON Location.id = BlockedDentist.locationId)

	•	hygienistId (int): The ID of the Talent who was unhappy with the dental office (ie. JOIN Hygienist ON Hygienist.id = BlockedDentist.hygienistID).

**<span style="text-decoration:underline;">RoleMapping” Table</span>**

**Description:** This table tracks the roles of all users based on role codes, and joins to the User table.

**Columns:**

	•	principalId (int): This is the User ID of the user.

	•	roleId (int): Differentiates between the role of the User (4: Dental Office, 6: Hygienist, 7: Dental Assistant, 8: Admin front desk, 9: Associate Dentist).

**<span style="text-decoration:underline;">“BlockedHygienist” Table</span>**

**Description:** Sometimes a dental office is so unhappy with a Talent that the office doesn’t want the Talent working at their office again.  This table tracks the details of that ‘blocking’, and indicates which Talent are unable to view temping shift postings from which locations.

**Columns:**

	•	hygienistId (int): The ID of the Talent that the dental office was unhappy with.

	•	locationId (int): The ID of the dental office that is blocking the specific Talent.

**<span style="text-decoration:underline;">“hireJob” Table</span>**

**Description:** TempStars has a Job Board for permanent and contract hiring which operates similar to classified ads or “Indeed” service.  Dental offices post a Job for a permanent or contract position.  Candidates submit their application to the Job Board posting, then it is up to the dental office to contact the candidate, arrange interviews and hire them to the team.  The “hireJob” table tracks the records relating to the Job Board posting done by the dental office. Note: While most tables in the database have a capitalized first letter, the “hireJob” table name begins with a lowercase ‘h’.

**Columns:**

	•	locationId (int): The ID of the dental office that is posting the Job on the Job Board.

	•	jobType (int): Indicates the type of Talent position required by the office in the Job Board posting (0: Dental Hygienist, 1: Dental Assistant, 2: Administrator/Manager, 3: Associate Dentist).

•	status (int): Indicates the status of the Job Board posting (0: Pending review, 1: Approved and active, 2: Removed by dental office 3: Expired listing).

	•	resumesViewed (int): A count of how many unique candidate resumes were viewed by the dental office for that Job Board posting.

	•	createdOn (timestamp): Indicates the date when the dental office posted the job to the Job Board.

**<span style="text-decoration:underline;">“AboutMeInput” Table</span>**

**Description:** Talent can write a short cover letter for their profile.  This table tracks what the Talent input into the About Me text field.

**Columns:**

	•	hygienistId (int): The ID of the Talent who entered the About Me

	•	input (varchar): The text that the Talent inputted into About Me

	•	submissionTimestamp (datetime): The timestamp of when the About Me was inputted by the Talent.

**<span style="text-decoration:underline;">“JobApplications” Table</span>**

**Description:** TempStars has a Job Board for permanent and contract hiring, which operates similar to classified ads or “Indeed”.  Dental offices post a Job for a permanent or contract position.  The “JobApplications” table tracks the status of applications that candidates submit to the dental office’s Job Board posting.

**Columns:**

	•	hireJobId (int): The ID of the hireJob record that the JobApplication relates to (JOIN hireJob ON JobApplications.hireJobId = hireJob.id

	•	hygienistId (int): Indicates the ID of the Talent that submitted the application  for the Job Board posting.

•	createdOn (timestamp): Indicates when the Talent candidate submitted the application for the Job Board posting.

•	resumeViewed (int): Indicates if the candidate application was viewed by the dental office (0: not viewed, 1: yes viewed).

•	status (int): Indicates the status of the candidate application. (0: submitted, 1: application was viewed, 2: Candidate resume was open/viewed 3: The office opted to reveal their contact details to the Talent, 4: application removed by candidate).

	•	interviewStatus (int): Indicates if the candidate’s application is designated for an interview. (0: not viewed, 1: viewed, 2: interview scheduled, 3: missed interview).

	•	resumeViewedOn (timestamp): Indicates the datetime when the dental office first viewed the candidate application.

**<span style="text-decoration:underline;">“Invoice” Table</span>**

**Description:** After a temping shift, Talent create and send an invoice to the dental office where they worked, so they can be paid by the dental office for work performed.  The “Invoice” table describes the details of Invoices created by Talent and sent to Dental Offices after a shift is completed.  This accounts for hours worked by the Talent, combined with their hourly rate and any unpaid time.

**Columns:**

	•	id (int): The unique ID of the Invoice record.

	•	jobID  (int): Indicates the ID of the temping shift corresponding to the invoice. (JOIN Job ON Job.id = Invoice.jobId).  

•	totalHours:  The number of hours from the start to end of the temping shift.

	•	totalUnpaidHours: The number of hours that were considered “unpaid time” during the shift, which could be lunch, breaks, etc.

	•	totalBillableHours:  This is the ‘totalHours’ minus ‘totalUnpaidHours’ which constitute the number of billable hours worked by the talent during the shift.

•	hourlyRate:  The dollar per hour amount earned by the Talent during the shift.

	•	totalInvoiceAmt:  This is the total amount invoiced to the dental office by the Talent, and is ‘totalBillableHours’ multiplied by ‘hourlyRate’.

	•	createdOn (datetime): This is the timestamp of when the invoice was created.

**TABLE JOIN Relationships**

	•	Job.locationId <-> Location.id

	•	Job.hygienistId <-> Hygienist.id

	•	User.hygienistId <-> Hygienist.id

	•	PartialOffer.jobId <-> Job.id

•	User.dentistId <-> Dentist.id

	•	PartialOffer.hygienistId <-> Hygienist.id

	•	DentistCancelled.jobId <-> Job.id

	•	DentistCancelled.locationId v Location.id

	•	HygienistCancelled.hygienistId <-> Hygienist.id

	•	Invoice.jobId <-> Job.id

	•	User.dentistId <-> Dentist.id

	•	Location.dentistId <-> Dentist.id

	•	BlockedHygienist.hygienistId <-> Hygienist.id

•	RoleMapping.principalId <-> User.id

•	hireJob.id <-> JobApplications.hireJobId

•	hireJob.locationId <-> Location.id

•	JobApplications.hygienistId <-> Hygienist.id

	•	BlockedDentist.locationId <-> Location.id

•	Invoice.jobId <-> Job.id

•	Shift.jobId <-> Job.id

=====END BUSINESS CONTEXT AND DATABASE SCHEMA=====

Given all the context above, follow these instructions and guidelines:

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

6. Visual Design Implementation:
   - Refer to the provided design screenshots to ensure accurate implementation
   - Pay close attention to UI elements, layouts, and visual details shown in the designs
   - Provide specific instructions on implementing the UI components shown in the screenshots
   - When relevant, include CSS styling details that match the design screenshots
   - The TempStars platform is on mobile, tablet and desktop.  So optimize your implementation for all devices.

7. Video Context:
   - If explanation videos are provided, reference insights from those videos in your implementation plan
   - Use the verbal explanations in the videos to understand nuanced requirements that may not be clear from the tickets alone
   - Align your implementation approach with any specific guidance given in the videos

Please provide your guidance and instructions in the following structure:

1. SUMMARY
An overview of the the Jira ticket(s) along with the scope and purpose of the work.

2. AFFECTED FILES
- Identify all files that will be touched or referenced when working on the Jira ticket(s), including the full paths
- Identify new files that need to be created and their full path
- File details and paths of image assets that need to be added to the project

3. A HIGHLY DETAILED INSTRUCTION GUIDE FOR IMPLEMENTING THE JIRA TICKET(S)
- Instructions should be clear and highly-detailed
- Instructions should be actionable and specific
- Instructions should be organized and laid out in a way that is easy to understand and follow for a beginner developer
- Instructions should be organized and ordered in a prioritized step-by-step manner "first do this, then do that, etc." that is easy to understand and follow
- If design screenshots are provided, reference them specifically when describing UI implementation
- If explanation videos are provided, refer to timestamps or specific information from those videos
- Include notes on how to implement specific visual elements seen in the designs

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

// Export for Node.js
module.exports = { generateSystemPrompt }; 