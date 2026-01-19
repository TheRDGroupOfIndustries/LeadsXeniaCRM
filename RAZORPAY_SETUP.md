# Razorpay Payment Integration Setup Guide

## Overview
Your XeniaCRM CRM now has a complete Razorpay payment gateway integration. This guide will help you configure and test the payment system.

## Features Implemented

### 1. Backend API Routes
- **Create Payment Order**: `/api/payments/create-order`
  - Creates Razorpay orders
  - Requires user authentication
  - Stores payment records in database

- **Verify Payment**: `/api/payments/verify`
  - Verifies payment signatures using HMAC-SHA256
  - Updates payment status in database
  - Handles success/failure states

- **Payment Webhooks**: `/api/payments/webhook`
  - Handles real-time payment status updates
  - Processes multiple webhook events (captured, failed, etc.)

- **Get Payments**: `/api/payments`
  - Fetches user's payment history
  - Returns formatted payment data

### 2. Frontend Components
- **Payment Form**: `RazorpayPayment.tsx`
  - React component with Razorpay Checkout integration
  - Configurable amount and description
  - Success/error handling

- **Payment Dashboard**: `/payments`
  - Complete payment management interface
  - Payment history with status tracking
  - Modal-based payment creation

### 3. Database Schema
- **Payment Model**: Comprehensive tracking including:
  - Order ID and payment IDs
  - Amount and currency
  - Payment status and method
  - Razorpay metadata
  - User relationship

## Setup Instructions

### Step 1: Database Migration
```bash
cd XeniaCRM
npx prisma db push
```

### Step 2: Razorpay Account Setup
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings > API Keys
3. Generate Test API Keys
4. Note down your:
   - Key ID (starts with `rzp_test_`)
   - Key Secret

### Step 3: Environment Configuration
Update your `.env` file with actual Razorpay credentials:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
```

### Step 4: Database Connection
Ensure your database connection is working:
```bash
npx prisma db push
npx prisma studio  # Optional: View database
```

### Step 5: Test the Integration
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/payments` in your app

3. Click "Make Payment" to test

4. Use Razorpay test card numbers:
   - Success: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

## Webhook Configuration (Production)

### 1. Razorpay Webhook Setup
1. Go to Razorpay Dashboard > Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

### 2. Security
The webhook endpoint automatically verifies signatures using your webhook secret.

## Testing Checklist

- [ ] Database migration successful
- [ ] Environment variables configured
- [ ] Payment creation works
- [ ] Payment verification works
- [ ] Payment history displays correctly
- [ ] Webhook handling works (if configured)

## Test Cards for Development

| Card Number | Type | Result |
|------------|------|--------|
| 4111 1111 1111 1111 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 4000 0000 0000 0002 | Visa | Card declined |
| 4000 0000 0000 9995 | Visa | Insufficient funds |

## Troubleshooting

### Database Connection Issues
- Check your `DATABASE_URL` in `.env`
- Ensure your Neon database is active
- Run `npx prisma db push` to sync schema

### Payment Failures
- Verify Razorpay credentials
- Check browser console for errors
- Ensure test mode is enabled

### Webhook Issues
- Verify webhook URL is accessible
- Check webhook signature verification
- Monitor Razorpay webhook logs

## Production Deployment

1. **Switch to Live Keys**:
   - Replace `rzp_test_` keys with `rzp_live_` keys
   - Update webhook URLs to production domain

2. **Security Considerations**:
   - Enable HTTPS for all payment endpoints
   - Implement rate limiting
   - Monitor payment logs

3. **Compliance**:
   - Ensure PCI DSS compliance
   - Implement proper error handling
   - Add payment audit logs

## File Structure

```
src/
├── app/
│   ├── api/payments/
│   │   ├── create-order/route.ts
│   │   ├── verify/route.ts
│   │   ├── webhook/route.ts
│   │   └── route.ts
│   └── (user)/payments/page.tsx
├── components/ui/
│   └── RazorpayPayment.tsx
├── lib/
│   └── razorpay.ts
└── prisma/
    └── schema.prisma (Payment model)
```

## Next Steps

1. **Customize Payment Flow**: Modify amount calculation logic
2. **Add Subscription Support**: Implement recurring payments
3. **Payment Analytics**: Add reporting and analytics
4. **Email Notifications**: Send payment confirmation emails
5. **Invoice Generation**: Create PDF invoices for payments

## Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For implementation questions, check the code comments in the respective files.