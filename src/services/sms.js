async function sendSms(args) {
  const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
  const to = args.to;
  const message = args.message;

  if (!to) {
    return { ok: false, provider, skipped: true, reason: 'missing_phone' };
  }

  if (provider === 'mock') {
    return { ok: true, provider: 'mock' };
  }

  if (provider === 'smsethiopia') {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return { ok: false, provider, reason: 'missing_api_key' };
    }

    const msisdn = to.replace(/^\+/, '');

    const res = await fetch('https://smsethiopia.et/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'KEY': apiKey
      },
      body: JSON.stringify({ msisdn, text: message })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error('sms_smsethiopia_failed: ' + text);
    }

    return { ok: true, provider: 'smsethiopia' };
  }

  if (provider === 'webhook') {
    const webhook = process.env.SMS_WEBHOOK_URL;
    if (!webhook) {
      return { ok: true, provider: 'webhook_placeholder' };
    }

    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (process.env.SMS_API_KEY || '')
      },
      body: JSON.stringify({ to: to, message: message })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error('sms_webhook_failed: ' + text);
    }

    return { ok: true, provider: 'webhook' };
  }

  return { ok: true, provider: 'mock_fallback' };
}

module.exports = { sendSms };