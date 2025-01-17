# Database Schema Reference

> This document provides database schema context for AI-powered code reviews.

**##TempStars SQL Database and Schema**

TempStars is web and mobile based two-sided marketplace platform that connects dental offices (“Demand”) with dental professionals (“Supply” aka “Talent”) for temping and hiring.   \
 \
Definition of Terms:

“Job Board” is TempStars service for hiring connections, either for contract or permanent positions.  For the Job Board, dental offices post a “Job” and Talent apply to the Job posting as candidates or applicants.  The Job Board is similar to “Indeed” but for dentistry.  The Talent for the Job Board are dental hygienists, dental assistants, dental office managers, dental admin and associate dentists.

“Temping” is TempStars service for fast and easy temping connections.  These are one-day “Shifts” where the dental office needs a temporary dental hygienist or dental assistant to fill in temporarily for a day.  For “Temping”, dental offices post a “Shift” and Talent send in “Offers”.  Talent for Temping is restricted to dental hygienists and dental assistants.

The following headings, description and columns are a description of TempStars database schema.

TempStars uses an AWS instance of RDS SQL database running SQL Engine version 5.7.38, and does not support ‘with’ statements, so write all queries to be compatible with SQL Engine version 5.7.38

**<span style="text-decoration:underline;">“Hygienist” Table</span>**

**Description**: Stores information about Talent records (ie. dental hygienists, dental assistants, dental office managers, dental admin and associate dentists).   \
 \
Note:  There is no email column in this table.  Talent emails are stored in the User table.  To retrieve Talent email addresses, you need JOIN User ON User.hygienistId = Hygienist.id) \


**Columns**:

	•	id (int): The ID of the Talent.

	•	firstName (varchar): The first name of the Talent.

	•	lastName (varchar): The last name of the Talent.

	•	type (int): Differentiates between dental hygienists (0) and dental assistants (1) and dental admin (2) and associate dentists (3).

	•	createdOn (datetime): Registration timestamp for the Talent. “NULL” if the registration process was not completed.

	•	city (varchar): The city where the Talent lives.

	•	province (varchar): The province or state where the Talent lives.

	•	postalCode (varchar): Indicates the Postal Code (in Canada) or Zip Code (in United States) where theTalent lives.

	•	country (int): Indicates the country in which the Talent lives (0 = Canada, 1 = United States)

	•	graduationYear (int): The year when theTalent graduated from their professional school.

	•	status (int): Differentiates between membership status for Talent. (-3: “Blacklisted” means no access to Job Board or temping, -2: “Blocked” means access to Job Board but no access to temping, -1: “Probation” means Talent can only book one shift at a time, 0: “Active” means Talent has full access to temping and Job Board, 1: “Pro” means tTalent has attained a level of great reliability and professionalism and positive feedback with between 5 and 10 temping shifts completed, 2: “Elite” means Talent has attained an exceptional level of professionalism, reliability and positive feedback with more than 10 shifts completed.

	•	lat(varchar) and lon(varchar): Indicates the latitude and longitude of where the Talent lives

•	stripeAccountId: NOT NULL when Talent has registered for Stripe Express Payouts, and the value in this field represents the unique ID for the Stripe Express account set up by the Talent.

•	isOrtho: Indicates the Talent is qualified to provide orthodontic treatment (1: is qualified, 2: is not qualified)

•	isRestorative: Indicates the Talent is qualified to provide restorative dental treatment (1: is qualified, 2: is not qualified)

•	isComplete: Indicates the Talent has completed signup registration (1: has completed sign-up)

**<span style="text-decoration:underline;">“Location” Table</span>**

**Description:** Stores details of dental office Locations.  Remember that “Location” refers to a dental office location of business, and is not the geographic location.  So in this context, “dental office” and “location” are used interchangeably.

**Columns**:

	•	id (int): The ID of the dental office location.

	•	practiceName (varchar): The name of the dental office location.

	•	city (varchar): The city where the dental office is located.

•	createdOn (datetime):  The date the Location signed up with TempStars \
	•	email (varchar):  The email of the Location

	•	phone (varchar):  The phone number of the Location

	•	province (varchar): The province or state where the dental office is located, using standard 2-letter abbreviations for states and provinces.

	•	postalCode (varchar): The postal code or zip code of the dental office.

	•	country (int): Indicates the country where the dental office is located (0 = Canada, 1 = United States)

	•	isCentralBooked (int): Indicates if the Location is part of a large dental corporation (aka a ‘DSO’) (0: Not corporate, 1: ‘Dentalcorp’ DSO Corporate location, 2: ‘123Dentist’ Corporate location).

	•	lat(varchar) and lon(varchar): Indicates the latitude and longitude of where the dental office is located.

	•	stripeCustomerId (varchar): If the dental office has entered payment information into their account the stripeCustomerId  the Stripe Account ID.  This value is NULL if the dental office has not entered payment information.

	•	defaultProposedRateHygienist (int): Indicates the default proposed hourly rate that the dental office pays Hygienists

	•	defaultProposedRateAssistant (int): Indicates the default proposed hourly rate that the dental office pays dental assistants.

	•	ppeEndorsed (int): Indicates the number of times that Talent have indicated the office has PPE and Infection control standards that meet or exceed requirements.

	•	friendlyEndorsed (int): Indicates the number of times that Talent have indicated that the office is a friendly place to work.

•	equipEndorsed (int): Indicates the number of times that Talent have indicated the office has good tools and equipment.

•	vaxRequired (int): Indicates if the dental office has a policy in place that requires employees to be vaccinated against COVID. 

**<span style="text-decoration:underline;">“Job” Table</span>**

**Description**: Stores information related to TempStars “Temping” service.  Stores information about  shifts that are posted by dental offices, and the details of the working connection if the shift is booked and/or completed by Talent.  Temping is only for dental hygienists and dental assistants.

**Columns:**

	•	status (int): The status of the shift (1: Posted, 2: Has at least one offer from Talent 3: Booked, 4:Completed, 5: Had received offers but all offers expired, 6: The shift posting was active but went unfilled and was not completed by the startDate, 7: canceled or removed by the dental office).

	•	startDate (YYYY-MM-DD): The actual date the shift is to be worked by Talent.  **Important note: ** Because Job.startDate is in the “YYYY-MM-DD” format, you often need to convert it to a different format (“YYYY-MM-DD hh:mm:ss”) for data analysis.

	•	locationId (int): The ID of the dental office Location that posting the temping shift.

	•	hygienistId (int): Indicates the ID of the Talent who is booked for the shift.  Has a value of ‘0’ of the shift is not booked, and the ID of the Talent booked for the shift if the value is greater than 0. (0: not booked, >0: Talent is booked). 

	•	dentistRating (int): Review score given by the Talent to the dental office (Note: a value “0” value means the dental office was unrated)

	•	hygienistRating (int): Review score given by the dental office to the Talent  (Note: “0” value means the Talent was unrated).

	•	dentistBilled (int): Indicates whether TempStars placement fee was collected (0: not collected, 1: collected) for a completed shift.

	•	hourlyRate (decimal): Indicates the hourly rate earned by the Talent working the shift (the value indicates dollars per hour).

	•	postedOn (date): Indicates when a temping shift was posted on TempStars service by the dental office.

	•	type (int): Indicates if the shift requires a Hygienist (0) or Dental Assistant (1).

	•	bookedOn (datetime): Indicates the timestamp of when the shift booking was confirmed between the dental office and the Talent.

	•	dentistPrivateNotes (varchar): Indicates any private feedback notes the dental office made about the Talent who worked the shift

	•	hygienistPrivateNotes (varchar): Indicates any private feedback notes the Talent made about the dental office where the shift was completed.

**<span style="text-decoration:underline;">“User” Table</span>**

**Description**: Stores user information, including email addresses.

**Columns:**

	•	email (varchar): The email of the user.  NOTE:  Do not use this field for dental office location emails.  When referencing dental office location emails, only use Location.email fields.  Do use  this column for Talent emails by JOIN User.hygienistId = Hygienist.id.

	•	hygienistId (int): The ID of the Talent associated with the User record.

	•	dentistId (int): This is NOT NULL if the User record is related to a dental office location.

	•	platform: Indicates the platform used for signing up (NULL means web, “Android” means Android, iOS means iPhone).

	•	referredBy (int): This column identifies the User.id of the user that referred the current user record to the platform.  For example:  If User.id ‘5678’ has a User.referredBy value of ‘1234’, then this means that User ‘5678’ was referred by User ‘1234’.

**<span style="text-decoration:underline;">“PartialOffer” Table</span>**

**Description:** Talent submit offers to work temping shifts posted by Dental Offices.  The “PartialOffer” table table stores details of offers made by Talent for those temping shifts.

**Columns:**

	•	jobId (int): The ID of the temping shift associated with the offer (ie. JOIN Job ON Job.id = PartialOffer.jobId)

	•	hygienistId (int): The ID of the Talent who sent the offer (ie. JOIN Hygienist ON Hygienist.id = PartialOffer.hygienistId)

	•	createdOn (datetime): The timestamp of when the offer was sent.

	•	hourlyRate (decimal): The hourly rate offered by the Talent for the shift.

	•	numViews (int): The number of times the offer was viewed by the dental office.

	•	firstViewed (datetime): The timestamp of when the offer was first viewed by the dental office.

	•	lastViewed (datetime): The timestamp of the most recent viewing of the offer by the dental office

	•	status (int): Differentiates the role of user  (0: Sent, 1: Rejected, 2: Accepted/Booked, 3: Expired, 4: Removed by Talent)

**<span style="text-decoration:underline;">“DentistCancelled” Table</span>**

**Description**: Sometimes dental offices cancel a shift that is booked.  The DentistCancelled table tracks the details when dental offices cancel a shift.

**Columns**:

	•	jobId (int): The ID of the canceled shift (ie. JOIN Job ON Job.id = DentistCancelled.jobId)

	•	locationId (int): The ID of the location that canceled the shift (ie. JOIN Location ON Location.id = DentistCancelled.locationId)

	•	cancelTimeStamp (datetime): The timestamp of when the shift was canceled by the dental office.

	•	shortNotice (int): Indicates whether the cancellation was short notice, less than 24hrs before the shift was scheduled to start (0: not short notice, 1: was short notice).

===
**<span style="text-decoration:underline;">“HygienistReliabilityScore” Table</span>**

**Description**: This table contains columns that indicate the objective score related to a hygienist’s reliability in booking and completing temping shifts.  A high reliability score indicates good performance, a low score indicates poor performance.  These values change as Talent completes shifts and cancels shifts.

**Columns**:

	•	HygienistId (int): The ID of the Talent in question who has a track record for reliability.

	•	cancellationScore (float): This represents a score related to the number and timing of Talent cancellations as they relate to the start of the shift.  Short-notice cancellations are worth more cancellation points, likewise cancelling a shift further ahead is lower points. But overall, lower points are better and mean a more reliable Talent.  

	•	overallReliability (float): This is a calculation based on a formula that takes into account the ‘cancellationScore’ and the number of  complete shifts by the Talent in their history of working with TempStars.

	•	recentReliability (float): This is a calculation based on a formula that takes into account the ‘cancellationScore’ and the number of  complete shifts by the Talent in the past 90 days.

	•	weightedReliability (float): This is a calculator that takes [(0.3 * overallReliability) + (0.7 * recentReliability0] to give an overall weighted score to indicate the Talents reliability, giving favour to their most recent shift reliability.

**<span style="text-decoration:underline;">“HygienistCancelled” Table</span>**

**Description**: Sometimes Talent cancels a shift that is booked.  The HygienistCancelled table tracks the details when Talent cancels a shift.

**Columns:**

	•	jobId (int): The ID of the canceled shift (ie. JOIN Job ON Job.id = HygienistCancelled.jobId)

	•	cancelTimestamp (datetime): Indicates when the shift was canceled by the Talent.

	•	rebookedBy (int): Indicates whether the shift was rebooked by another Talent.  The value is ‘0’ if the shift was not rebooked, and if the value is >0, that value is the HygienistID of the talent that rebooked the shift.

	•	hygienistId (int): Indicates the ID of the Talent who canceled the shift (ie. JOIN Hygienist ON Hygienist.id = HygienistCancelled.hygienistId)

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

	•	locationId (int): The ID of the dental office that is posting the Job.

	•	jobType (int): Indicates the type of Talent position required by the office in the Job Board posting (0: Dental Hygienist, 1: Dental Assistant, 2: Administrator/Manager, 3: Associate Dentist).

•	status (int): Indicates the status of the Job Board posting (0: Pending review, 1: Approved and active, 2: Removed by dental office 3: Expired listing).

	•	resumesViewed (int): A count of how many unique candidate resumes were viewed by the dental office for that Job Board posting.

	•	createdOn (timestamp): Indicates the date when the dental office posted the job to the Job Board.

**<span style="text-decoration:underline;">“JobApplications” Table</span>**

**Description:** TempStars has a Job Board for permanent and contract hiring, which operates similar to classified ads or “Indeed”.  Dental offices post a Job for a permanent or contract position.  The “JobApplications” table tracks the status of applications that candidates submit in the Job Board for a Job Posting.

**Columns:**

	•	hireJobId (int): The ID of the hireJob record that the JobApplication relates to (JOIN hireJob ON JobApplications.hireJobId = hireJob.id

	•	hygienistId (int): Indicates the Talent ID that submitted the application  for the Job Board posting.

•	createdOn (timestamp): Indicates when the Talent candidate submitted the application for the Job Board posting.

	•	resumeViewed (int): Indicates if the candidate application was viewed by the dental office (0: not viewed, 1: yes viewed).

•	status (int): Indicates the status of the candidate application. (0: submitted, 1: application viewed, 2: resume was opened 3: office contact details revealed, 4: application removed by candidate).

	•	interviewStatus (int): Indicates if the candidate’s application is designated for an interview. (0: not viewed, 1: viewed, 2: interview scheduled).

	•	resumeViewedOn (timestamp): Indicates the datetime when the dental office first viewed the candidate application.

**<span style="text-decoration:underline;">“Invoice” Table</span>**

**Description:** After a temping shift, Talent create and send an invoice to the dental office where they worked, so they can be paid by the dental office for work performed.  The “Invoice” table describes the details of Invoices created by Talent and sent to Dental Offices after a shift is completed.  This accounts for hours worked by the Talent, combined with their hourly rate and any unpaid time.

**Columns:**

	•	id (int): The unique ID of the Invoice record.

	•	jobID  (int): Indicates the ID of the temping shift corresponding to the invoice. (JOIN Job ON Job.id = Invoice.jobId).  

•	totalHours:  The number of hours worked by the Talent in the shift.

	•	totalUnpaidHours: The number of hours that were considered “unpaid time” during the shift, which could be lunch, breaks, etc.

	•	totalBillableHours:  This is the ‘totalHours’ minus ‘totalUnpaidHours’ which constitute the number of billable hours worked by the talent during the shift.

•	hourlyRate:  The dollar per hour amount earned by the Talent during the shift.

	•	totalInvoiceAmount:  This is the total amount invoiced to the dental office by the Talent, and is ‘totalBillableHours’ multiplied by ‘hourlyRate’.

	•	createdOn (datetime): This is the timestamp of when the invoice was created.

**TABLE JOIN Relationships**

	•	Job.location &lt;-> Location.id

	•	Job.hygienistId &lt;-> Hygienist.id

	•	User.hygienistId &lt;-> Hygienist.id

	•	PartialOffer.jobId &lt;-> Job.id

	•	PartialOffer.hygienistId &lt;-> Hygienist.id

	•	DentistCancelled.jobId &lt;-> Job.id

	•	DentistCancelled.locationId &lt;-> Location.id

	•	HygienistCancelled.hygienistId &lt;-> Hygienist.id

	•	Invoice.jobId &lt;-> Job.id

	•	User.dentistId &lt;-> Dentist.id

	•	Location.dentistId &lt;-> Dentist.id

	•	BlockedHygienist.hygienistId &lt;-> Hygienist.id

•	RoleMapping.principalId &lt;-> User.id

•	hireJob.id &lt;-> JobApplications.hireJobId

•	hireJob.locationId &lt;-> Location.id

•	JobApplications.hygienistId &lt;-> Hygienist.id

	•	BlockedDentist.locationId &lt;-> Location.id

•	Invoice.jobId &lt;> Job.id
