# Scripts Directory

This directory contains utility scripts for database management and development.

## Available Scripts

### 1. `add_user_name_fields.py`

Migration script to add `firstname`, `lastname`, and `nickname` fields to the `users` table.

**Usage:**
```bash
# From the veya-api directory
python scripts/add_user_name_fields.py
```

This script safely adds the columns if they don't already exist.

### 2. `create_test_user.py`

Creates a test user with the following details:
- Email: `khoinguyent@gmail.com`
- Firstname: `To`
- Lastname: `Nguyen`
- Nickname: `Kyan`

And generates a JWT token for bypassing login on the frontend.

**Usage:**
```bash
# From the veya-api directory
python scripts/create_test_user.py
```

**Output:**
- Creates/updates the user in the database
- Creates/updates the user profile
- Generates a JWT token (valid for 1 year)
- Saves the token to `test_user_token.txt` in the project root
- Prints user details and token to console

**Using the Token:**
1. Copy the token from the console output or `test_user_token.txt`
2. Use it in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```
3. Test with curl:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/me
   ```

## Running Scripts in Docker

If your database is running in Docker:

```bash
# Run migration
docker-compose exec api python scripts/add_user_name_fields.py

# Create test user
docker-compose exec api python scripts/create_test_user.py
```

## Prerequisites

- Database connection configured in `.env` or environment variables
- All dependencies installed (`pip install -r requirements.txt`)
- Database tables initialized (run `init_db()` or start the API)

## Notes

- The test user script will update an existing user if the email already exists
- The JWT token is valid for 1 year (365 days) for development convenience
- In production, use shorter token expiration times

