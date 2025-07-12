const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing database...');

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
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
      )
    `);

    // Create order tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_tracking (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        status VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        picture VARCHAR(500),
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vendors/Restaurants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT NOT NULL,
        cuisine_type VARCHAR(100),
        operating_hours JSONB,
        delivery_radius INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Menu items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Riders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS riders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car')),
        license_number VARCHAR(100),
        is_available BOOLEAN DEFAULT true,
        current_location POINT,
        rating DECIMAL(3,2) DEFAULT 5.00,
        total_deliveries INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDatabase };