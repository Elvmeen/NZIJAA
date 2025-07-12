
# Hosting Setup Guide for Nzija Delivery Service

## Required Environment Variables

### 1. Supabase Configuration (REQUIRED)
You need a Supabase account and project:

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings → API in your Supabase dashboard
4. Copy these values:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Session Security (REQUIRED)
Generate a secure session secret:

```bash
# Generate using OpenSSL
openssl rand -base64 32

# Or use online generator: https://generate-secret.vercel.app/32
```

Set as:
```
SESSION_SECRET=your-generated-secret-here
```

### 3. Basic Server Config (REQUIRED)
```
NODE_ENV=production
PORT=5000
```

## Supabase Database Setup

1. In your Supabase dashboard, go to SQL Editor
2. Run the SQL file `supabase-setup.sql` to create tables
3. Or manually create these tables:

```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  special_instructions TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order tracking table
CREATE TABLE order_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Optional Configurations

### Google OAuth (Optional)
If you want Google Sign-In:
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add your domain to authorized origins
4. Set: `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

### CORS (Optional but recommended)
For production security:
```
CORS_ORIGIN=https://yourdomain.com
```

## Hosting Provider Instructions

### For most hosting providers (Vercel, Netlify, Railway, etc.):

1. Create account on your hosting provider
2. Connect your GitHub repository
3. Set environment variables in the hosting dashboard
4. Deploy

### Build Command:
```
npm install
```

### Start Command:
```
npm start
```

### Port:
Most hosting providers will override PORT automatically, but keep it as 5000 in your env file.

## Testing Your Deployment

1. Visit `https://yourdomain.com/health` - should return OK status
2. Visit `https://yourdomain.com/debug-auth.html` - to test all connections
3. Visit `https://yourdomain.com/auth.html` - to test authentication
4. Visit `https://yourdomain.com` - main landing page

## Troubleshooting

### Common Issues:

1. **"Supabase not configured"** error:
   - Check your SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
   - Visit `/debug-auth.html` to see detailed diagnostics

2. **Session/Authentication errors**:
   - Ensure SESSION_SECRET is set and is at least 32 characters
   - Check Supabase project is active and accessible

3. **Database errors**:
   - Run the SQL setup script in Supabase
   - Check your Supabase service key has proper permissions

4. **CORS errors**:
   - Set CORS_ORIGIN to your domain
   - Check your Supabase project allows your domain

## Support

- Check `/debug-auth.html` for diagnostic information
- Check `/health` endpoint for server status
- View server logs in your hosting provider's dashboard
