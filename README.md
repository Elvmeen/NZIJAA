
# Nzija Delivery Service

A modern food delivery platform built with Node.js, Express, and PostgreSQL.

## Features

- Order management system
- Real-time order tracking
- Google OAuth authentication
- Multi-portal dashboards (Customer, Vendor, Rider)
- PostgreSQL database integration

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **Authentication:** Google OAuth

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
NODE_ENV=production
PORT=3000
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables
4. Start the server:
   ```bash
   npm start
   ```

## Database Setup

The app automatically initializes the required PostgreSQL tables on startup. Make sure your `DATABASE_URL` is properly configured.

## Deployment

1. Set the `DATABASE_URL` environment variable on your hosting platform
2. Set the `GOOGLE_CLIENT_ID` environment variable
3. Deploy using the start script: `npm start`

## API Endpoints

- `POST /order` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id/status` - Update order status
- `POST /auth/google` - Google OAuth verification

## License

MIT
