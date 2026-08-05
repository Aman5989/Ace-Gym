// frontend/js/app.js
// NOTE: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values or set them at build time.
const SUPABASE_URL = 'REPLACE_WITH_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'REPLACE_WITH_SUPABASE_ANON_KEY';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility: first day of next calendar month (returns YYYY-MM-DD)
function firstDayOfNextMonthISO() {
  const d = new Date();
  // use local timezone (browser) — for display assume Asia/Kolkata
  const y = d.getFullYear();
  const m = d.getMonth();
  const next = new Date(y, m + 1, 1);
  return next.toISOString().slice(0,10);
}

// Registration flow
const regForm = document.getElementById('register-form');
const message = document.getElementById('message');
if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(regForm);
    const payload = {
      first_name: fd.get('first_name'),
      last_name: fd.get('last_name'),
      email: fd.get('email'),
      phone: fd.get('phone') || null,
      plan: fd.get('plan') || 'monthly',
      next_due_date: firstDayOfNextMonthISO()
    };
    try {
      const { data, error } = await supabase.from('members').insert([payload]);
      if (error) throw error;
      message.textContent = `Registered. Next due date: ${payload.next_due_date}`;
      regForm.reset();
    } catch (err) {
      message.style.color = 'red';
      message.textContent = `Registration error: ${err.message || err}`;
    }
  });
}

// Admin UI
const loginForm = document.getElementById('login-form');
const adminSection = document.getElementById('admin-section');
const authSection = document.getElementById('auth-section');
const signoutBtn = document.getElementById('signout');
const membersTableBody = document.querySelector('#members-table tbody');
const memberRowTmpl = document.getElementById('member-row');
const refreshBtn = document.getElementById('refresh');
const searchInput = document.getElementById('search');
const paymentForm = document.getElementById('payment-form');

async function renderMembers(filter) {
  if (!membersTableBody) return;
  membersTableBody.innerHTML = '';
  let query = supabase.from('members').select('id,first_name,last_name,email,phone,plan,next_due_date');
  if (filter) {
    // basic client-side filtering not provided by supabase-js directly without RLS complexities
  }
  const { data, error } = await query.order('next_due_date', { ascending: true });
  if (error) {
    membersTableBody.innerHTML = `<tr><td colspan="7">Error loading members: ${error.message}</td></tr>`;
    return;
  }
  for (const m of data) {
    const tr = document.importNode(memberRowTmpl.content, true);
    tr.querySelector('.name').textContent = `${m.first_name} ${m.last_name}`;
    tr.querySelector('.email').textContent = m.email;
    tr.querySelector('.phone').textContent = m.phone || '';
    tr.querySelector('.plan').textContent = m.plan;
    tr.querySelector('.next_due').textContent = m.next_due_date;
    // fetch last payment for this member (single query)
    const { data: p, error: perr } = await supabase.from('payments').select('paid_for_date,amount_cents,currency').eq('member_id', m.id).order('paid_for_date', { ascending: false }).limit(1);
    tr.querySelector('.last_paid').textContent = perr || !p || p.length === 0 ? '-' : `${p[0].paid_for_date} — ${(p[0].amount_cents/100).toFixed(2)} ${p[0].currency}`;
    const actionsTd = tr.querySelector('.actions');
    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'Copy ID';
    viewBtn.addEventListener('click', () => { navigator.clipboard.writeText(m.id); alert('Member ID copied to clipboard'); });
    actionsTd.appendChild(viewBtn);
    membersTableBody.appendChild(tr);
  }
}

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    authSection.style.display = 'none';
    adminSection.style.display = 'block';
    renderMembers();
  } else {
    authSection.style.display = 'block';
    adminSection.style.display = 'none';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const email = fd.get('email');
    const password = fd.get('password');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await checkAuth();
    } catch (err) {
      alert('Login error: ' + (err.message || err));
    }
  });
}

if (signoutBtn) signoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); checkAuth(); });
if (refreshBtn) refreshBtn.addEventListener('click', () => renderMembers());
if (searchInput) searchInput.addEventListener('input', () => renderMembers());

if (paymentForm) {
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(paymentForm);
    const member_id = fd.get('member_id');
    const amount = Math.round(parseFloat(fd.get('amount'))*100);
    const paid_for_date = fd.get('paid_for_date');
    const note = fd.get('note') || null;
    try {
      const { error: insertErr } = await supabase.from('payments').insert([{ member_id, amount_cents: amount, currency: 'INR', paid_for_date, note }]);
      if (insertErr) throw insertErr;
      // fetch current member next_due_date
      const { data: members } = await supabase.from('members').select('next_due_date').eq('id', member_id).single();
      const currentNext = members?.next_due_date;
      if (currentNext === paid_for_date) {
        const base = new Date(currentNext + 'T00:00:00');
        const newNext = new Date(base.getFullYear(), base.getMonth() + 1, 1);
        const newNextStr = newNext.toISOString().slice(0,10);
        const { error: updErr } = await supabase.from('members').update({ next_due_date: newNextStr }).eq('id', member_id);
        if (updErr) throw updErr;
      }
      alert('Payment recorded');
      paymentForm.reset();
      renderMembers();
    } catch (err) {
      alert('Error recording payment: ' + (err.message || err));
    }
  });
}

// initial check
checkAuth();
