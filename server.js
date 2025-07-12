require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const { pool, initializeDatabase } = require('./database');
// Supabase configuration (hardcoded for static hosting)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avwdsgyvbvqxrohacvcq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2d2RzZ3l2YnZxeHJvaGFjdmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTkyMTMsImV4cCI6MjA2NzI3NTIxM30.F4MapgSz5MlH1Ye9uNndZQGTy0b5oVzXb4co5H-XzoI";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2d2RzZ3l2YnZxeHJvaGFjdmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY5OTIxMywiZXhwIjoyMDY3Mjc1MjEzfQ.yxOoaUnLsHgTM0XXCrM-DA7254MvDFMu95oCnZqVgt8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Initialize database on startup
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@hostname:port/database') {
  initializeDatabase().catch(console.error);
} else {
  console.warn('Database not configured - running in demo mode');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.warn('Warning: GOOGLE_CLIENT_ID environment variable not set');
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Configure CORS for external hosting
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(bodyParser.json());
// Serve static files (but exclude HTML files that have routes)
app.use(express.static('.', { 
  index: false,  // Don't serve index.html by default
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'css', 'js', 'ico', 'json']
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nzija-delivery-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve main landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve portal selection page
app.get('/portals', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve index.html at /select-portal route
app.get('/select-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve authentication page
app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Serve confirmation success page
app.get('/confirmation-success.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'confirmation-success.html'));
});

// Serve profile management page
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

// Serve debug authentication page
app.get('/debug-auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-auth.html'));
});

// Serve tracking page
app.get('/track.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'track.html'));
});

// Serve portal files
app.get('/customer/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer', 'dashboard.html'));
});

app.get('/vendor/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'vendor', 'dashboard.html'));
});

app.get('/rider/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'rider', 'dashboard.html'));
});

// Generate tracking ID
function generateTrackingId() {
  const prefix = 'NZJ';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Handle order submission
app.post("/order", async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    const trackingId = generateTrackingId();
    return res.status(200).json({ 
      message: "Order received successfully! (Demo mode - database not configured)",
      orderId: "DEMO-" + Date.now(),
      trackingId: trackingId,
      estimatedDelivery: "30-45 minutes"
    });
  }

  const client = await pool.connect();

  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryAddress,
      items,
      totalAmount,
      paymentMethod,
      specialInstructions
    } = req.body;

    // Generate unique tracking ID
    const trackingId = generateTrackingId();

    // Insert new order into database
    const result = await client.query(`
      INSERT INTO orders (
        customer_name, customer_phone, customer_address, 
        delivery_address, items, total_amount, payment_method, 
        special_instructions, status, payment_status, tracking_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending', $9)
      RETURNING id, created_at, tracking_id
    `, [
      customerName, customerPhone, customerAddress,
      deliveryAddress, JSON.stringify(items), totalAmount,
      paymentMethod, specialInstructions, trackingId
    ]);

    const orderId = result.rows[0].id;

    // Add initial tracking entry
    await client.query(`
      INSERT INTO order_tracking (order_id, status, notes)
      VALUES ($1, 'Order Placed', 'Order has been received and is being processed')
    `, [orderId]);

    console.log("New order received:", customerName, "Order ID:", orderId, "Tracking ID:", trackingId);

    res.status(201).json({ 
      message: "Order received successfully!",
      orderId: orderId,
      trackingId: result.rows[0].tracking_id,
      estimatedDelivery: "30-45 minutes"
    });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: "Failed to save order" });
  } finally {
    client.release();
  }
});

// Get all orders (for admin/vendor dashboard)
app.get("/api/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT o.*, 
             array_agg(
               json_build_object(
                 'status', ot.status,
                 'location', ot.location,
                 'notes', ot.notes,
                 'timestamp', ot.timestamp
               ) ORDER BY ot.timestamp
             ) as tracking_history
      FROM orders o
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  } finally {
    client.release();
  }
});

// Get specific order by ID
app.get("/api/orders/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = req.params.id;
    const result = await client.query(`
      SELECT o.*, 
             array_agg(
               json_build_object(
                 'status', ot.status,
                 'location', ot.location,
                 'notes', ot.notes,
                 'timestamp', ot.timestamp
               ) ORDER BY ot.timestamp
             ) as tracking_history
      FROM orders o
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  } finally {
    client.release();
  }
});

// Track order by tracking ID
app.get("/api/track/:trackingId", async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    const trackingId = req.params.trackingId;
    return res.status(200).json({
      trackingId: trackingId,
      status: "In Transit",
      estimatedDelivery: "25 minutes",
      currentLocation: "Kampala Central",
      trackingHistory: [
        {
          status: "Order Placed",
          location: "Restaurant",
          notes: "Order received and confirmed",
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
        },
        {
          status: "Preparing",
          location: "Kitchen",
          notes: "Food is being prepared",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          status: "Out for Delivery",
          location: "On Route",
          notes: "Rider is on the way",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ]
    });
  }

  const client = await pool.connect();

  try {
    const trackingId = req.params.trackingId;
    const result = await client.query(`
      SELECT o.*, 
             array_agg(
               json_build_object(
                 'status', ot.status,
                 'location', ot.location,
                 'notes', ot.notes,
                 'timestamp', ot.timestamp
               ) ORDER BY ot.timestamp
             ) as tracking_history
      FROM orders o
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
      WHERE o.tracking_id = $1
      GROUP BY o.id
    `, [trackingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tracking ID not found" });
    }

    const order = result.rows[0];
    res.json({
      trackingId: order.tracking_id,
      orderId: order.id,
      status: order.status,
      customerName: order.customer_name,
      deliveryAddress: order.delivery_address,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      trackingHistory: order.tracking_history.filter(h => h.status !== null)
    });
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ error: "Failed to track order" });
  } finally {
    client.release();
  }
});

// Update order status
app.put("/api/orders/:id/status", async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = req.params.id;
    const { status, location, notes } = req.body;

    // Update order status
    await client.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [status, orderId]);

    // Add tracking entry
    await client.query(`
      INSERT INTO order_tracking (order_id, status, location, notes)
      VALUES ($1, $2, $3, $4)
    `, [orderId, status, location, notes]);

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  } finally {
    client.release();
  }
});

// Google OAuth verification
app.post('/auth/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role: role || 'customer',
      loginTime: new Date().toISOString()
    };

    // Store user in session
    req.session.user = user;

    // Save user to file (simple user storage)
    fs.readFile("users.json", (err, data) => {
      const users = err ? [] : JSON.parse(data);
      const existingUserIndex = users.findIndex(u => u.id === user.id);

      if (existingUserIndex >= 0) {
        // Update existing user
        users[existingUserIndex] = { ...users[existingUserIndex], ...user };
      } else {
        // Add new user
        users.push(user);
      }

      fs.writeFile("users.json", JSON.stringify(users, null, 2), (err) => {
        if (err) console.error('Error saving user:', err);
      });
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
});

// Logout route
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/auth/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Get Google OAuth configuration
app.get('/api/google-config', (req, res) => {
  res.json({ 
    clientId: GOOGLE_CLIENT_ID || 'not-configured'
  });
});

// Supabase configuration endpoint (hardcoded for static hosting)
app.get('/api/supabase-config', (req, res) => {
  try {
    res.json({
      configured: true,
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    });
  } catch (error) {
    console.error('Supabase config error:', error);
    res.status(500).json({
      configured: false,
      error: 'Failed to retrieve Supabase configuration',
      message: error.message
    });
  }
});

// Traditional login endpoint (fallback when Supabase not configured)
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, role, name, mode } = req.body;

    // Basic validation
    if (!email || !password || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // If Supabase is configured, let it handle auth on frontend
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      return res.status(200).json({ 
        success: true, 
        message: 'Authentication handled by Supabase on frontend',
        useSupabase: true
      });
    }

    // Fallback demo mode warning
    console.warn('⚠️ Supabase not configured - using demo mode');

    return res.status(503).json({ 
      success: false, 
      error: 'Authentication service not configured. Please set up Supabase environment variables.' 
    });

  } catch (error) {
    console.error('Auth endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication service error' 
    });
  }
});

// User session endpoint
app.get('/auth/session', async (req, res) => {
  try {
    if (supabaseAdmin) {
      // Get session from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name,
          role: profile?.role || 'customer',
          ...profile
        }
      });
    } else {
      res.status(503).json({ error: 'Authentication service not available' });
    }
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
});

// Inventory Management Endpoints

// Get vendor inventory
app.get('/api/vendor/:vendorId/inventory', async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    return res.status(200).json([
      {
        id: 1,
        name: "Rolex",
        category: "Main Course",
        price: 3000,
        stock: 50,
        isAvailable: true
      },
      {
        id: 2,
        name: "Chapati",
        category: "Main Course", 
        price: 1500,
        stock: 25,
        isAvailable: true
      }
    ]);
  }

  const client = await pool.connect();
  try {
    const vendorId = req.params.vendorId;
    const result = await client.query(`
      SELECT * FROM menu_items 
      WHERE vendor_id = $1 
      ORDER BY category, name
    `, [vendorId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  } finally {
    client.release();
  }
});

// Add/Update inventory item
app.post('/api/vendor/:vendorId/inventory', async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    return res.status(200).json({ 
      message: "Item added successfully (Demo mode)",
      id: Date.now()
    });
  }

  const client = await pool.connect();
  try {
    const vendorId = req.params.vendorId;
    const { name, description, price, category, stock, isAvailable } = req.body;

    const result = await client.query(`
      INSERT INTO menu_items (vendor_id, name, description, price, category, stock, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [vendorId, name, description, price, category, stock || 0, isAvailable !== false]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding inventory item:", error);
    res.status(500).json({ error: "Failed to add inventory item" });
  } finally {
    client.release();
  }
});

// Update inventory item
app.put('/api/vendor/:vendorId/inventory/:itemId', async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    return res.status(200).json({ 
      message: "Item updated successfully (Demo mode)"
    });
  }

  const client = await pool.connect();
  try {
    const { vendorId, itemId } = req.params;
    const { name, description, price, category, stock, isAvailable } = req.body;

    const result = await client.query(`
      UPDATE menu_items 
      SET name = $1, description = $2, price = $3, category = $4, 
          stock = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND vendor_id = $8
      RETURNING *
    `, [name, description, price, category, stock, isAvailable, itemId, vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  } finally {
    client.release();
  }
});

// Delete inventory item
app.delete('/api/vendor/:vendorId/inventory/:itemId', async (req, res) => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://username:password@hostname:port/database') {
    return res.status(200).json({ 
      message: "Item deleted successfully (Demo mode)"
    });
  }

  const client = await pool.connect();
  try {
    const { vendorId, itemId } = req.params;

    const result = await client.query(`
      DELETE FROM menu_items 
      WHERE id = $1 AND vendor_id = $2
      RETURNING *
    `, [itemId, vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Test Supabase connection endpoint
app.get('/api/test-supabase', async (req, res) => {
  try {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;

    if (!hasUrl || !hasAnonKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supabase environment variables not configured',
        details: {
          url_configured: hasUrl,
          anon_key_configured: hasAnonKey,
          service_key_configured: hasServiceKey,
          instructions: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables'
        }
      });
    }

    if (supabase) {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession();

      return res.json({
        success: true,
        message: 'Supabase connection successful',
        url: process.env.SUPABASE_URL.substring(0, 30) + '...',
        has_service_key: hasServiceKey,
        timestamp: new Date().toISOString(),
        status: 'Ready for authentication'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Supabase client not initialized'
      });
    }
  } catch (error) {
    console.error('Supabase test error:', error);
    res.status(500).json({
      success: false,
      error: 'Supabase connection test failed',
      details: error.message
    });
  }
});

// Debug route to test server
app.get('/test', (req, res) => {
  res.send(`
    <h1>Nzija Server is Running!</h1>
    <p>Time: ${new Date().toISOString()}</p>
    <p>Port: ${PORT}</p>
    <a href="/">Go to Main Landing Page</a>
  `);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Nzija delivery service running on port ${PORT}`);
  console.log(`✅ Server started successfully!`);
  console.log(`🌍 Local: http://0.0.0.0:${PORT}`);
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`🔗 Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  } else {
    console.log(`🔗 External URL: Check your Replit webview`);
  }
  console.log(`📱 Main landing page: ${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : `http://0.0.0.0:${PORT}`}`);
  console.log(`🔐 Authentication page: /auth.html`);
  console.log(`🔧 Health check: /health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, '0.0.0.0');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});