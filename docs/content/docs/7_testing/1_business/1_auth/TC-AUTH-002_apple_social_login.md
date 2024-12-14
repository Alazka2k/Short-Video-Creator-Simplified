# Social Login Test Cases

## Test Case: TC-AUTH-001 - Google Login Flow
**Description**: User should be able to sign in using their Google account.

### Steps
1. User navigates to login page
2. User clicks "Sign in with Google" button
3. User selects Google account
4. User grants permissions
5. User is redirected back to application

### Acceptance Criteria
- [ ] User is successfully authenticated
- [ ] User profile is created/updated with Google information
- [ ] User is redirected to dashboard
- [ ] User's role and permissions are correctly assigned
- [ ] Trial subscription is created for new users

### Edge Cases
- User denies Google permissions
- User cancels during Google login
- Network interruption during authentication
- User has existing account with different provider

## Test Case: TC-AUTH-002 - Apple Login Flow
**Description**: User should be able to sign in using their Apple ID.

### Steps
1. User navigates to login page
2. User clicks "Sign in with Apple" button
3. User authenticates with Face ID/Touch ID
4. User approves data sharing
5. User is redirected back to application

### Acceptance Criteria
- [ ] User is successfully authenticated
- [ ] User profile is created/updated with Apple information
- [ ] Private email relay is handled correctly
- [ ] User is redirected to dashboard
- [ ] User's role and permissions are correctly assigned 