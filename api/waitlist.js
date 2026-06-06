export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;

  if (SB_URL && SB_KEY) {
    try {
      await fetch(`${SB_URL}/rest/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email, name: name || null })
      });
    } catch(e) {}
  }

  if (!KEY) return res.status(200).json({ ok: true });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#0D0D0D;color:#F1EEE7;font-family:'Helvetica Neue',sans-serif}
.w{max-width:560px;margin:0 auto;padding:40px 24px}
.ey{font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#B8893B;margin-bottom:20px}
.t{font-family:Impact,sans-serif;font-size:64px;line-height:0.9;text-transform:uppercase;margin-bottom:6px}
.t .w2{color:#F1EEE7}.t .g{color:#B8893B}
.sub{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#888;margin-bottom:32px}
.box{background:#171717;border:1px solid #2A2A2A;padding:20px 24px;margin-bottom:28px}
.brow{font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#B8893B;margin-bottom:3px}
.bval{font-size:13px;font-weight:600;color:#F1EEE7}
.body{font-size:14px;line-height:1.7;color:#888;margin-bottom:24px}
.body b{color:#F1EEE7}
.quote{border-left:2px solid #B8893B;padding-left:14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:24px 0}
.foot{font-size:11px;color:#444;text-align:center;margin-top:32px;line-height:1.6}
</style></head><body>
<div class="w">
<div class="ey">Formation &rarr; Healing &rarr; Wisdom &rarr; Obedience</div>
<div class="t"><span class="w2">Built</span><br><span class="g">Before</span><br><span class="w2">Bonded</span></div>
<div class="sub">You&rsquo;re on the list.</div>
<div class="box" style="display:flex;gap:24px;flex-wrap:wrap">
<div><div class="brow">Presented by</div><div class="bval">Elder Eli Castaneda</div></div>
<div><div class="brow">Date</div><div class="bval">June 6, 2026</div></div>
<div><div class="brow">Location</div><div class="bval">Rosen Centre Hotel</div></div>
</div>
<div class="body">${name ? `<b>${name},</b><br><br>` : ''}You&rsquo;re officially on the waitlist for <b>Built Before Bonded</b> &mdash; a singles seminar on getting your life in order before relationships get complicated.<br><br>We&rsquo;ll send you access as soon as it goes live on <b>June 6th at 12:00 PM</b>.</div>
<div class="quote">Relationships do not create your foundation. They reveal it.</div>
<div class="foot">Built Before Bonded &mdash; Singles Seminar 2026<br>Rosen Centre Hotel &middot; June 6, 2026</div>
</div></body></html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ from: `Built Before Bonded <${FROM}>`, to: email, subject: "You're on the list — Built Before Bonded", html })
    });
  } catch(e) {}
  return res.status(200).json({ ok: true });
}
