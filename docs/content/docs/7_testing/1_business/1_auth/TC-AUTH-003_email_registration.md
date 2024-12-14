# Email Registration Test Cases

## Test Case: TC-AUTH-003 - New User Registration
**Description**: User should be able to create a new account using email.

### Steps
1. User clicks "Create Account"
2. User enters email, password, name
3. User submits registration form
4. User receives verification email
5. User clicks verification link
6. User completes profile setup

### Acceptance Criteria
- [ ] User account is created with correct information
- [ ] Verification email is sent
- [ ] User can't access protected areas until verified
- [ ] Password meets security requirements
- [ ] Trial subscription is created
- [ ] Welcome email is sent

### Edge Cases
- Invalid email format
- Password too weak
- Email already registered
- Verification link expires
- User tries to login before verification 