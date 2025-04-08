Description

Dental offices use various dental practice management software programs.  TempStars currently collects information about which software a dental office uses, which helps a dental hygienist or assistant prepare for their temping shift.

We want to implement 3 changes:

1.  Update the list of dental practice management software during dental office sign-up
2. Update the list of dental practice management software in the Location profile
3. Create a one-time update modal for collecting updated information about a dental office’s dental practice management software.   This one-time modal should also ask the dental office how satisfied they are with their current software.

In Scope

Update the list of software during sign-up

Update the list of software in a dental office Location profile

Create a one-time modal asking an office to update their practice management software

In the modal, include a 1-5 rating score for satisfaction

Create a column in the Location table for recording software satisfaction

Note: Location.software already exists to record which software the Location uses.

Acceptance Criteria

Given a dental office is registering for TempStars 

When they complete they are filling out the registration form

Then they should be prompted to select their practice management software from a dropdown list (this funcationality exists already)

And the list of software should be the new updated list

And the options should be correctly listed depending on if office is in US or Canada

And this information should be stored in their profile upon completing registration

Given a dental office is already registered with TempStars 

When they successfully post a shift,  

Then they should be prompted to update and provide their practice management software 

And the list of software should be the new updated list

And the options should be correctly listed depending on if office is in US or Canada

And they should see the satisfaction rate question

And this prompt should be required

And the satisfaction data should be stored in their Location profile once submitted (ie. Location.softwareHappy)

Given a dental office is on the Location profile page:  

When they edit the software indicated in their Profile,  

Then they should see the updated list of software options 

And the options should be different depending on if office is in US or Canada

And the data should be stored in their Location profile once submitted 

Given a dental office has signed up on or after the date this feature is released:  

When they successfully post a temping shift,  

Then they should not see the one-time software update and satisfaction modal.



References & Resources:

Updated Candian List of Software Options:

Dentrix

ABELDent

ClearDent

Paradigm Clinical

Tracker

Progident/Clinique

Power Practice

Open Dental

Dentitek

MaxiDent

Updated US List of Software Options:

MaxiDent

ClearDent

Dentrix

Curve Dental/Curve Hero

Open Dental

ABELDent

ADSTRA Dental

Oryx Dental Software

CareStack

EagleSoft

Additional Notes

Current Software List for both USA and CA (same list for both countries)

Dentrix

AbelDent

Tracker

EagleSoft

Paradigm 

Open Dental 

Curve Dental

Other 

Technical Implementation Details

Add a new column called “softwareHappy” in the Location table database schema

Create a simple one-time popup survey for existing users that appears when they successfully post a temping shift

Ensure the satisfaction rating uses a standard 1-5 numeric rating system

QA Notes

Test with multiple browser types and versions

Ensure proper data validation for the satisfaction rating field

Verify that reporting accurately reflects submitted data



