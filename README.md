# Group4HSBC

## Application Overview

### backend

This backend is an application which monitors specified Github repositories through the installation of our webhook.\
The application will scan all terraform files in every pull request created in the repository for violations against rules specified by the HSBC sponsors.\
The scanned results are emailed to the creator of the pull request.\
**Note: Emails do not display as designed on Microsoft Outlook.**

### frontend

There is a frontend component to this application which allows users to view data of violations detected from pull requests.\
There are two privilege levels: regular user, and admin.
- Regular users can view a list of their own violations.
- Admins can view violations from all users, and have access to several other functions.
    - Add rules and mark rules as active/inactive
    - View violation statistics from all repositories

## installation

The backend installation instructions should be completed in the following order:
1. AWS CLI
2. Dependencies
3. Email
4. Deploy
5. Webhook

## Available Scripts

### `yarn setUpTemplate`

**IMPORTANT: Do not run this more than once, this is to create a template on AWS SES and does not update it**\
**Note: This is part of the setup process. Refer to the Email Setup Instructions documentations.**\
Uploads email templates to your specified AWS account.

### `yarn updateTemplate`

Used to update email templates after they have been set up.\
Make sure to have made correct changes to both the email templates and the upload json before using this.

### `yarn TestEmail`

**IMPORTANT: Before using this, modify the sendEmailManual.json file and change both the source and to address to the one you specified in the .env file**\
Sends one test email from your specified source email to the same email.\
This is used to make sure you have successfully uploaded the email templates and have entered the correct source email.