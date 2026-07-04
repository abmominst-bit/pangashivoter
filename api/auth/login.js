import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const rawBody = req.body;
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {};
  const email = body.email;
  const password = body.password;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPassword = String(password).trim();

  if (normalizedEmail === 'admin@bestvoter.com' && normalizedPassword === 'admin12345') {
    return res.status(401).json({ success: false, error: 'Demo admin credentials are not allowed. Please use a real authenticated admin account.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const sb = createClient(supabaseUrl, supabaseKey);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        return res.status(200).json({ success: true, message: 'Logged in successfully', user: data.user });
      }
    } catch (e) {
      console.error('Supabase auth login error:', e);
    }
  }

  return res.status(401).json({ success: false, error: 'Invalid admin credentials!' });
}
