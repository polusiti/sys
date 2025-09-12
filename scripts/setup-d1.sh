#!/bin/bash
# D1 database setup script for TestApp

echo "Setting up D1 database for TestApp..."

# Create D1 database
echo "Creating D1 database..."
wrangler d1 create testapp-database

echo ""
echo "Please update wrangler.toml with the database_id returned above."
echo ""

# Apply migrations
echo "Applying initial migration..."
wrangler d1 migrations apply testapp-database --local

echo ""
echo "To apply migrations to production:"
echo "wrangler d1 migrations apply testapp-database --remote"
echo ""

echo "D1 setup complete!"
echo "Don't forget to:"
echo "1. Update the database_id in wrangler.toml"
echo "2. Set a secure JWT_SECRET in wrangler.toml"
echo "3. Deploy with: wrangler deploy"