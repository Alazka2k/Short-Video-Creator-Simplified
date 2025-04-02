# TC-AUTH-003: Email/Password Login

## Description
Verify that registered users can successfully authenticate using their email and password.

## Prerequisites
- Existing user account
- Valid email and password
- Clean browser state

## Test Steps

### Happy Path
1. Navigate to the login page
2. Enter registered email address
3. Enter correct password
4. Click "Sign In" button
5. Verify successful authentication

### Expected Results
- User is successfully authenticated
- User is redirected to dashboard
- Navigation bar shows user information
- Access token is properly stored
- Previous session data is loaded

## Edge Cases

### Remember Me Functionality
1. Login with "Remember Me" checked
- Session persists after browser restart
- Token refresh works correctly
- Extended session duration is applied

### Multiple Devices
1. Login on desktop browser
2. Login on mobile device
- Both sessions remain active
- Actions in one session reflect in other
- Proper session management

### Account Security

#### Failed Login Attempts
1. Test with incorrect password multiple times
- Account lockout after threshold
- Lockout duration is enforced
- Email notification sent
- CAPTCHA/verification triggered

#### Password Requirements
1. Test password with special characters
2. Test maximum length passwords
3. Test Unicode passwords
4. Test password with spaces

### Error Scenarios

#### Invalid Credentials
1. Test with:
   - Wrong email
   - Wrong password
   - Non-existent account
- Clear error messages
- No security information leaked
- Failed attempt counting

#### Account Status
1. Test with:
   - Unverified account
   - Suspended account
   - Deleted account
- Appropriate status messages
- Clear next steps provided

#### Network Issues
1. Submit during network interruption
- Data preservation
- Retry mechanism
- Clear error feedback

## Acceptance Criteria
- [ ] Successful login with valid credentials
- [ ] Failed login with invalid credentials
- [ ] Remember me functionality works
- [ ] Account lockout after failed attempts
- [ ] Password reset link accessible
- [ ] Security measures enforced
- [ ] Mobile responsive design
- [ ] Loading states displayed
- [ ] Error messages clear and helpful

## Notes
- Test cross-browser compatibility
- Verify secure token storage
- Check CSRF protection
- Monitor login response times
- Test rate limiting
- Verify audit logging
- Check security headers 