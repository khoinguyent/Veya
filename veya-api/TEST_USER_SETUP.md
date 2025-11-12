# Test User Setup Guide

This guide explains how to set up a test user for development and bypass login in the frontend.

## Quick Start

1. **Run the migration** to add name fields to the users table:
   ```bash
   python scripts/add_user_name_fields.py
   ```

2. **Create the test user**:
   ```bash
   python scripts/create_test_user.py
   ```

3. **Use the generated JWT token** in your frontend to bypass login.

## Test User Details

The test user will be created with:
- **Email**: `khoinguyent@gmail.com`
- **Firstname**: `To`
- **Lastname**: `Nguyen`
- **Nickname**: `Kyan`
- **Display Name**: `To Nguyen`
- **Auth Provider**: `email`
- **Is Guest**: `false`
- **Is Active**: `true`

## Using the JWT Token

### Getting the Token

After running `create_test_user.py`, the token will be:
1. Printed to the console
2. Saved to `test_user_token.txt` in the project root

### Using in Frontend

Store the token and use it in API requests:

```typescript
// Store token (e.g., in AsyncStorage for React Native)
const token = "your-jwt-token-here";

// Use in API calls
fetch('http://localhost:8000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Testing with curl

```bash
# Replace <token> with your actual token
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/me
```

## Database Changes

### New Fields Added to User Model

The following fields have been added to the `users` table:
- `firstname` (VARCHAR(255), nullable)
- `lastname` (VARCHAR(255), nullable)
- `nickname` (VARCHAR(255), nullable)

These fields are also available in:
- `User` model (`app/models/user.py`)
- `UserBase` schema (`app/schemas/user.py`)
- `UserResponse` schema (`app/schemas/user.py`)

## Running in Docker

If your database is running in Docker containers:

```bash
# Run migration
docker-compose exec api python scripts/add_user_name_fields.py

# Create test user
docker-compose exec api python scripts/create_test_user.py

# The token will be saved inside the container
# You can copy it out or view it in the logs
```

## Token Details

- **Expiration**: 365 days (1 year) for development convenience
- **Algorithm**: HS256
- **Payload**: Contains user ID (`sub` claim)
- **Usage**: Use in `Authorization: Bearer <token>` header

## Updating an Existing User

If a user with the email `khoinguyent@gmail.com` already exists:
- The script will update the existing user with the new name fields
- The user profile will be updated if it exists, or created if it doesn't
- A new JWT token will be generated

## Troubleshooting

### Migration Fails

- Ensure database connection is configured correctly
- Check that the `users` table exists
- Verify database permissions

### User Creation Fails

- Check database connection
- Verify email uniqueness (the email must be unique)
- Check that all required dependencies are installed

### Token Not Working

- Verify the token is being sent correctly in the Authorization header
- Check that the token hasn't expired
- Ensure the API is running and can connect to the database
- Verify the JWT_SECRET_KEY matches between token generation and verification

## Next Steps

1. Use the token in your frontend app for development
2. Consider creating additional test users for different scenarios
3. For production, use proper authentication flow with Firebase
4. Set shorter token expiration times in production

## Related Documentation

- [Firebase Emulator Setup](./FIREBASE_EMULATOR_SETUP.md) - For Firebase emulator development
- [Authentication Guide](./AUTHENTICATION.md) - For production authentication
- [Scripts README](./scripts/README.md) - For script documentation

