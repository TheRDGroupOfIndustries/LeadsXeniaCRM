/* eslint-disable no-console */

const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing ${name} in .env`);
  }
  return String(value).trim();
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function run() {
  const accessToken = requireEnv('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = requireEnv('WHATSAPP_PHONE_NUMBER_ID');
  const graphVersion = (process.env.WHATSAPP_GRAPH_VERSION || 'v22.0').trim();

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const meUrl = `https://graph.facebook.com/${graphVersion}/me?fields=id,name`;
  const meRes = await fetch(meUrl, { headers });
  const meJson = await safeJson(meRes);
  console.log('ME status:', meRes.status);
  if (meRes.ok) {
    console.log('ME ok:', meJson && meJson.name ? meJson.name : '(no name returned)');
  } else {
    console.log('ME error:', meJson && meJson.error ? meJson.error.message : meJson);
  }

  const pnFields = [
    'id',
    'display_phone_number',
    'verified_name',
    'quality_rating',
    'account_mode',
    'code_verification_status',
    'whatsapp_business_account',
  ].join(',');

  const pnUrl = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}?fields=${encodeURIComponent(
    pnFields
  )}`;
  const pnRes = await fetch(pnUrl, { headers });
  const pnJson = await safeJson(pnRes);
  console.log('PHONE status:', pnRes.status);
  if (pnRes.ok) {
    console.log('PHONE ok:', {
      id: pnJson.id,
      display_phone_number: pnJson.display_phone_number,
      verified_name: pnJson.verified_name,
      quality_rating: pnJson.quality_rating,
      account_mode: pnJson.account_mode,
      code_verification_status: pnJson.code_verification_status,
      whatsapp_business_account: pnJson.whatsapp_business_account,
    });
  } else {
    console.log('PHONE error:', pnJson && pnJson.error ? pnJson.error.message : pnJson);
  }

  if (!pnRes.ok) {
    process.exitCode = 2;
  }
}

run().catch((err) => {
  console.error('Validation failed:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
