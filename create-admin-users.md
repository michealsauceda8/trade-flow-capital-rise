# Admin User Credentials

## Dummy Admin Users Created:

1. **Admin User**
   - Email: `admin@tradingfund.com`
   - Password: `Admin123!`
   - Role: admin

2. **Reviewer User**  
   - Email: `reviewer@tradingfund.com`
   - Password: `Review123!`
   - Role: reviewer

## Usage Instructions:

1. Go to `/auth` page
2. Sign up with the above credentials 
3. After signup, the users will be automatically added to admin_users table
4. Use these accounts to test admin functionality and application review workflow

## Email Configuration:

✅ Auto-confirm emails enabled (no need to check email for verification)
✅ Email notifications configured via database triggers
✅ Application received and status change emails will be tracked in email_notifications table