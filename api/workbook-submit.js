export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, name, session, answers, custom_html, send_admin_copy } = req.body || {};
  if (!email && !send_admin_copy) return res.status(400).json({ error: 'Missing email' });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;

  // Save answers to Supabase
  if (answers && SB_URL && SB_KEY && !send_admin_copy) {
    for (const a of answers) {
      try {
        await fetch(`${SB_URL}/rest/v1/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            name: a.anonymous ? 'Anonymous' : (name || 'Attendee'),
            email: a.anonymous ? null : email,
            session: typeof session === 'number' ? session : 0,
            category: a.category, response: a.text, anonymous: a.anonymous
          })
        });
      } catch(e) {}
    }
  }

  if (!KEY) return res.status(200).json({ ok: true });

  // Build HTML if not provided
  let html = custom_html;
  if (!html && answers && answers.length) {
    const labels = {
      1: "Session 1: Who's Building You?",
      2: "Session 2: What Are You Carrying?",
      3: "Session 3: Get Your Life in Order",
      4: "Session 4: Build Different",
      5: "Q&A Notes"
    };
    const answersHtml = answers.map(a => `
<div style="background:#171717;border:1px solid #2A2A2A;padding:14px 18px;margin-bottom:2px">
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#B8893B;margin-bottom:5px">${a.category}</div>
  <div style="font-size:13px;color:#F1EEE7;line-height:1.6">${(a.text||'').replace(/\n/g,'<br>')}</div>
</div>`).join('');

    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0D0D0D;color:#F1EEE7;font-family:'Helvetica Neue',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="font-family:Impact,sans-serif;font-size:56px;line-height:0.88;text-transform:uppercase;margin-bottom:8px">
    <span style="color:#F1EEE7;display:block">Built</span>
    <span style="color:#B8893B;display:block">Before</span>
    <span style="color:#F1EEE7;display:block">Bonded</span>
  </div>
  <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#888;font-family:'Helvetica Neue',sans-serif;margin-bottom:24px">${labels[session] || 'Your Workbook Answers'} &mdash; June 6, 2026</div>
  ${answersHtml}
  <div style="border-left:2px solid #B8893B;padding-left:14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-top:28px">Relationships do not create your foundation. They reveal it.</div>
  <div style="font-size:11px;color:#444;text-align:center;margin-top:28px">Built Before Bonded &middot; June 6, 2026 &middot; Elder Eli Castaneda</div>
</div></body></html>`;
  }

  if (!html) return res.status(200).json({ ok: true });

  // Determine recipient
  const toEmail = send_admin_copy ? ADMIN_EMAIL : email;
  const subject = send_admin_copy
    ? `[BBB Response] ${name} submitted their workbook`
    : custom_html
      ? `Your Complete Built Before Bonded Workbook`
      : `Your Session ${session} answers — Built Before Bonded`;

  if (!toEmail) return res.status(200).json({ ok: true });

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ from: `Built Before Bonded <${FROM}>`, to: toEmail, subject, html })
    });
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
