#!/bin/bash

# Deploy Search Functionality for Data Manager System
# This script sets up the complete search implementation

set -e

echo "🚀 Deploying Data Manager Search Functionality"
echo "============================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Create D1 database if it doesn't exist
echo "📊 Setting up D1 database..."
read -p "Enter your D1 database name (default: data-manager-search): " DB_NAME
DB_NAME=${DB_NAME:-data-manager-search}

# Try to create the database (will fail if it already exists, which is fine)
wrangler d1 create $DB_NAME || echo "Database might already exist, continuing..."

# Get database ID
DB_ID=$(wrangler d1 list | grep $DB_NAME | awk '{print $2}')
if [ -z "$DB_ID" ]; then
    echo "❌ Could not find database ID. Please check your database name."
    exit 1
fi

echo "✅ Database ID: $DB_ID"

# Update wrangler.toml with the correct database ID
echo "📝 Updating wrangler.toml with database configuration..."
sed -i "s/your-production-database-id/$DB_ID/g" cloudflare/wrangler.toml
sed -i "s/your-staging-database-id/$DB_ID/g" cloudflare/wrangler.toml

# Initialize database schema
echo "🏗️  Setting up database schema..."
cat > /tmp/schema.sql << 'EOF'
-- Create questions table with full-text search support
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    title TEXT,
    question TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mc', 'open', 'rootfrac')),
    choices TEXT, -- JSON array for multiple choice
    answer INTEGER, -- For multiple choice
    expected TEXT, -- JSON for open/rootfrac answers
    accepted TEXT, -- JSON array for accepted answers
    explanation TEXT,
    active BOOLEAN DEFAULT 1,
    audio_url TEXT,
    image_url TEXT,
    tags TEXT, -- JSON array of tags
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_questions_title ON questions(title);
CREATE INDEX IF NOT EXISTS idx_questions_question ON questions(question);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions(tags);

-- Insert sample data for testing
INSERT OR IGNORE INTO questions (id, subject, topic, difficulty, title, question, type, choices, answer, explanation, tags) VALUES
('q_math_sample_1', 'math', 'algebra', 3, '二次方程式の解法', '次の二次方程式を解きなさい。$x^2 - 5x + 6 = 0$', 'mc', '["x = 2, 3", "x = 1, 6", "x = -2, -3", "x = 0, 5"]', 0, 'たすき掛けを使って $(x-2)(x-3)=0$ より $x=2, 3$', '["二次方程式", "因数分解", "代数"]'),
('q_english_sample_1', 'english', 'grammar', 2, '現在完了形の用法', 'Choose the correct answer: I _____ to Tokyo three times.', 'mc', '["go", "went", "have gone", "am going"]', 2, '経験を表す現在完了形を使います。', '["現在完了", "文法", "動詞"]'),
('q_chemistry_sample_1', 'chemistry', 'organic', 4, 'アルカンの燃焼反応', 'メタン（CH₄）が完全燃焼するときの化学反応式を書きなさい。', 'open', NULL, NULL, '炭化水素の完全燃焼では二酸化炭素と水が生成されます。', '["有機化学", "燃焼反応", "化学反応式"]'),
('q_physics_sample_1', 'physics', 'mechanics', 3, '等加速度運動', '初速度5m/s、加速度2m/s²で運動する物体の3秒後の速度を求めなさい。', 'open', NULL, NULL, 'v = v₀ + at = 5 + 2×3 = 11 m/s', '["力学", "等加速度運動", "運動方程式"]');
EOF

wrangler d1 execute $DB_NAME --file=/tmp/schema.sql

echo "✅ Database schema created successfully"

# Deploy the worker
echo "🚀 Deploying Cloudflare Worker..."
cd cloudflare
wrangler deploy

echo "✅ Worker deployed successfully"

# Deploy static files to Cloudflare Pages (if applicable)
echo "📄 Static files ready for deployment:"
echo "- search.html"
echo "- assets/css/search.css"
echo "- assets/css/global.css"
echo "- assets/js/search-manager.js"
echo "- assets/js/questa-d1-client.js"
echo "- assets/js/search-integration.js"

echo ""
echo "🎉 Search functionality deployment complete!"
echo "============================================="
echo ""
echo "Next steps:"
echo "1. Upload the static files to your web hosting"
echo "2. Update your main website to include the search integration"
echo "3. Test the search functionality"
echo ""
echo "Files to upload:"
echo "- /home/higuc/search.html"
echo "- /home/higuc/assets/css/search.css"
echo "- /home/higuc/assets/css/global.css"
echo "- /home/higuc/assets/js/search-manager.js"
echo "- /home/higuc/assets/js/questa-d1-client.js"
echo "- /home/higuc/assets/js/search-integration.js"
echo ""
echo "Integration code:"
echo "Add this to your main website's HTML head:"
echo '<script src="assets/js/search-integration.js"></script>'
echo ""
echo "Worker URL: https://data-manager-search.{your-subdomain}.workers.dev"
echo ""
echo "🔍 Test your search functionality at: https://data.allfrom0.top/search.html"