// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // Contact form state
  const [formData, setFormData]       = useState({ challenge:'', name:'', email:'', phone:'', message:'' });
  const [otpSent, setOtpSent]         = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp]                 = useState('');
  const [otpError, setOtpError]       = useState('');
  const [otpLoading, setOtpLoading]   = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const [formError, setFormError]     = useState('');
  const [payDone, setPayDone]         = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    // Razorpay script
    const rzp = document.createElement('script');
    rzp.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(rzp);

    const SERVICES = [
      { title:"Course & Degree Clarity", desc:"Not sure what course or degree to pursue? We'll help you discover the right path based on your strengths and aspirations.", challenge:"I'm unsure which course or degree to pursue", img:"https://i.pinimg.com/1200x/01/e3/6c/01e36c77fc1e2548bd5bc5402a7fd267.jpg" },
      { title:"Finding Your Strength", desc:"Don't feel good at any subject? We help you identify hidden talents and chart a meaningful direction for your life.", challenge:"I want help finding my hidden strengths", img:"https://i.pinimg.com/1200x/85/19/7d/85197d5015c7c85187d940058d5ed693.jpg" },
      { title:"Science Stream Guidance", desc:"Good at Biology and Maths? There are incredible career options ahead. Let us map the best route for your unique profile.", challenge:"I need guidance choosing my science stream", img:"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80&auto=format&fit=crop" },
      { title:"Feel Stuck? Find Direction", desc:"Feeling lost without the right mentor? You're not alone. We provide the trusted guidance you deserve.", challenge:"I feel stuck and need direction", img:"https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&q=80&auto=format&fit=crop" },
      { title:"Job Decision Making", desc:"Got two job offers and confused? We help you weigh the pros and cons to choose the opportunity that truly fits you.", challenge:"I'm confused between two job offers", img:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&auto=format&fit=crop" },
      { title:"Life Happiness Coaching", desc:"Beyond career — your overall happiness matters. We coach you to align your work with your values and live a fulfilling life.", challenge:"I want to live a happier, more fulfilled life", img:"https://i.pinimg.com/736x/db/01/e2/db01e23291ce99d0410e2739cef1e4ce.jpg" },
    ];

    const grid = document.getElementById('cardGrid');
    if (grid && !grid.hasChildNodes()) {
      SERVICES.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'service-card reveal';
        card.innerHTML = `<img class="service-img" src="${s.img}" alt="${s.title}" loading="lazy">
          <div class="service-card-body">
            <h3>${s.title}</h3><p>${s.desc}</p>
            <button type="button" class="ask-btn" data-idx="${i}">Ask this question
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>`;
        grid.appendChild(card);
      });

      grid.addEventListener('click', e => {
        const btn = e.target.closest('.ask-btn');
        if (!btn) return;
        document.getElementById('contact')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    }

    // Mobile nav
    const nav = document.getElementById('primaryNav');
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => nav?.classList.toggle('open'));
    }
    document.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', () => nav?.classList.remove('open'));
    });

    // Footer links
    const fw = document.getElementById('footerWhatsapp');
    if (fw) fw.href = 'https://wa.me/919944920584';

    // Year
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();

    // Scroll reveal
    const els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
      }, { threshold: 0.08 });
      els.forEach(el => io.observe(el));
      setTimeout(() => els.forEach(el => el.classList.add('in-view')), 4000);
    } else {
      els.forEach(el => el.classList.add('in-view'));
    }

    return () => { try { document.body.removeChild(rzp); } catch(_){} };
  }, []);

  function handleFormChange(e) {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormError('');
  }

  // Step 1: Send OTP to email
  async function handleSendOtp() {
    if (!formData.name.trim())  { setFormError('Please enter your full name.'); return; }
    if (!formData.email.trim()) { setFormError('Please enter your email address.'); return; }
    if (!formData.phone.trim()) { setFormError('Please enter your phone number.'); return; }
    setOtpLoading(true);
    setOtpError('');
    setFormError('');
    try {
      await api.post('/auth/send-contact-otp', { email: formData.email, name: formData.name });
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setOtpLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp() {
    if (!otp || otp.length !== 6) { setOtpError('Please enter the 6-digit OTP.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/verify-contact-otp', { email: formData.email, otp });
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  }

  // Resend OTP
  async function handleResend() {
    if (countdown > 0) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/send-contact-otp', { email: formData.email, name: formData.name });
      setCountdown(60);
      setOtp('');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  }

  // Step 3: Pay ₹999
  function handlePay() {
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment loading, please try again in a moment.');
      return;
    }
    const options = {
      key: 'rzp_test_T1THvglw4S8TWG',
      amount: 99900, // ₹999 in paise
      currency: 'INR',
      name: 'NAMMA COACH',
      description: 'Career Coaching Session',
      prefill: { name: formData.name, contact: formData.phone, email: formData.email },
      theme: { color: '#2f6da3' },
      handler: () => {
        setPayDone(true);
      },
      modal: { ondismiss: () => {} },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  // WhatsApp after payment
  function handleWhatsApp() {
    const msg = [
      "Hi NAMMA COACH, I'd like guidance.",
      `Challenge: ${formData.challenge}`,
      `Name: ${formData.name}`,
      `Phone: ${formData.phone}`,
      `Email: ${formData.email}`,
      "Payment: ₹999 Paid ✅",
      formData.message ? `Message: ${formData.message}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/919944920584?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        :root{--navy-900:#0c2236;--navy-800:#142f4c;--navy-700:#1c3f63;--blue-600:#2f6da3;--blue-500:#4a8fc7;--blue-300:#8fc3ec;--blue-200:#bfe0f7;--ice-50:#eef6fc;--ice-100:#e1f0fa;--ink:#142a3d;--slate:#5b7387;--slate-light:#8aa0b3;--white:#ffffff;--radius-lg:22px;--radius-md:14px;--radius-sm:10px;--shadow-soft:0 18px 40px -18px rgba(12,34,54,0.25);--shadow-card:0 10px 30px -12px rgba(12,34,54,0.18);--font-display:'Sora',sans-serif;--font-body:'Inter',sans-serif;}
        *{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
        body{font-family:var(--font-body);color:var(--ink);background:var(--white);line-height:1.6;-webkit-font-smoothing:antialiased;}
        img,svg{display:block;}a{color:inherit;text-decoration:none;}button{font-family:inherit;cursor:pointer;border:none;background:none;}
        .wrap{max-width:1180px;margin:0 auto;padding:0 28px;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);color:var(--blue-200);}
        .eyebrow.on-light{background:var(--white);border:1px solid #d3e6f5;color:var(--blue-600);box-shadow:var(--shadow-card);}
        .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--blue-300);}
        header{position:sticky;top:0;z-index:100;background:linear-gradient(180deg,rgba(12,34,54,0.97),rgba(28,63,99,0.97));backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08);}
        .nav-row{display:flex;align-items:center;justify-content:space-between;height:78px;}
        .brand-name{font-family:var(--font-display);font-weight:800;font-size:18px;color:var(--white);}
        nav.primary-nav{display:flex;align-items:center;gap:36px;}
        nav.primary-nav a{font-weight:600;font-size:15px;color:rgba(255,255,255,.82);transition:color .2s;}
        nav.primary-nav a:hover{color:var(--white);}
        .header-actions{display:flex;align-items:center;gap:14px;}
        .login-btn{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,var(--blue-500),var(--blue-600));color:var(--white);font-family:var(--font-display);font-weight:700;font-size:14px;padding:10px 20px;border-radius:999px;box-shadow:0 6px 18px -6px rgba(47,109,163,0.6);cursor:pointer;transition:transform .2s,box-shadow .2s;}
        .login-btn:hover{transform:translateY(-2px);}
        .profile-pill{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);padding:8px 14px 8px 10px;border-radius:999px;color:rgba(255,255,255,.92);font-size:14px;font-weight:500;cursor:pointer;}
        .menu-toggle{display:none;color:rgba(255,255,255,.8);padding:6px;}
        .hero{position:relative;color:var(--white);padding:110px 0 80px;overflow:hidden;min-height:92vh;display:flex;align-items:center;}
        .hero-bg{position:absolute;inset:0;z-index:0;background-image:url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=85&auto=format&fit=crop');background-size:cover;background-position:center top;}
        .hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(12,34,54,.88) 0%,rgba(20,47,76,.82) 40%,rgba(47,109,163,.55) 80%,rgba(143,195,236,.35) 110%);}
        .hero::before{content:"";position:absolute;inset:0;z-index:1;background-image:repeating-linear-gradient(120deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 64px);pointer-events:none;}
        .hero-inner{position:relative;z-index:2;text-align:center;max-width:880px;margin:0 auto;}
        .hero .eyebrow{margin-bottom:26px;}
        .hero h1{font-family:var(--font-display);font-weight:800;font-size:clamp(34px,6vw,60px);line-height:1.08;margin-bottom:24px;}
        .hero h1 .accent{background:linear-gradient(90deg,var(--blue-300),var(--blue-200));-webkit-background-clip:text;background-clip:text;color:transparent;}
        .hero p.lede{font-size:18px;color:rgba(255,255,255,.90);max-width:620px;margin:0 auto 38px;}
        .hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:52px;}
        .btn{font-family:var(--font-display);font-weight:700;font-size:15px;padding:16px 30px;border-radius:999px;display:inline-flex;align-items:center;gap:9px;transition:transform .2s,box-shadow .2s;cursor:pointer;border:none;}
        .btn-primary{background:linear-gradient(90deg,var(--white),var(--blue-200));color:var(--navy-900);box-shadow:0 14px 30px -10px rgba(0,0,0,.35);}
        .btn-primary:hover{transform:translateY(-2px);}
        .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.4);color:var(--white);}
        .btn-ghost:hover{background:rgba(255,255,255,.14);transform:translateY(-2px);}
        .stat-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;}
        .stat-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:var(--radius-md);padding:18px 30px;min-width:140px;backdrop-filter:blur(8px);}
        .stat-card .num{font-family:var(--font-display);font-weight:800;font-size:28px;display:block;}
        .stat-card .label{font-size:13px;color:rgba(255,255,255,.72);margin-top:2px;}
        .scroll-hint{display:flex;justify-content:center;margin-top:46px;color:rgba(255,255,255,.6);animation:bob 2.4s ease-in-out infinite;}
        @keyframes bob{0%,100%{transform:translateY(0);}50%{transform:translateY(8px);}}
        .section-head{text-align:center;max-width:640px;margin:0 auto 56px;}
        .section-head h2{font-family:var(--font-display);font-weight:800;font-size:clamp(28px,4vw,42px);color:var(--ink);margin-bottom:14px;}
        .section-head p{color:var(--slate);font-size:16.5px;}
        .section-head .eyebrow{margin-bottom:18px;}
        .services{background:var(--ice-50);padding:100px 0 90px;}
        .card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:28px;}
        .service-card{background:var(--white);border-radius:var(--radius-lg);box-shadow:var(--shadow-card);border:1px solid #e7f0f8;display:flex;flex-direction:column;opacity:0;transform:translateY(18px);transition:opacity .6s,transform .6s,box-shadow .25s;overflow:hidden;}
        .service-card.in-view{opacity:1;transform:translateY(0);}
        .service-card:hover{box-shadow:0 22px 46px -16px rgba(12,34,54,.22);border-color:var(--blue-200);}
        .service-img{width:100%;height:180px;object-fit:cover;}
        .service-card-body{padding:24px 24px 20px;display:flex;flex-direction:column;flex:1;}
        .service-card h3{font-family:var(--font-display);font-weight:700;font-size:19px;margin-bottom:10px;}
        .service-card p{color:var(--slate);font-size:14.5px;flex:1;margin-bottom:20px;}
        .ask-btn{align-self:flex-start;background:var(--ice-100);color:var(--blue-600);font-weight:700;font-size:13.5px;padding:10px 16px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;transition:background .2s;}
        .ask-btn:hover{background:var(--blue-200);}
        .category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px;}
        .category-tile{position:relative;height:200px;border-radius:var(--radius-lg);overflow:hidden;display:flex;align-items:flex-end;padding:22px;color:var(--white);isolation:isolate;box-shadow:var(--shadow-card);}
        .category-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;}
        .category-tile::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(12,34,54,.82) 0%,transparent 100%);}
        .category-tile span{font-family:var(--font-display);font-weight:700;font-size:18px;}
        .about{background:linear-gradient(170deg,var(--navy-900),var(--navy-700) 90%);color:var(--white);padding:100px 0;}
        .about .section-head h2{color:var(--white);}
        .about .section-head p{color:rgba(255,255,255,.72);}
        .about-grid{display:grid;grid-template-columns:340px 1fr;gap:56px;align-items:start;}
        .coach-photo{aspect-ratio:1/1;border-radius:var(--radius-lg);overflow:hidden;border:3px solid rgba(255,255,255,.2);}
        .coach-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;}
        .coach-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:var(--radius-md);padding:20px 22px;margin-top:18px;}
        .coach-card h4{font-family:var(--font-display);font-size:18px;font-weight:700;}
        .coach-card p{font-size:13.5px;color:rgba(255,255,255,.65);margin-top:3px;}
        .badge-row{margin-top:14px;display:flex;flex-wrap:wrap;gap:10px;}
        .badge{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:rgba(255,255,255,.85);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);padding:8px 14px;border-radius:999px;}
        .about-copy p.bio{font-size:16.5px;color:rgba(255,255,255,.84);margin-bottom:30px;}
        .industries-box{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:var(--radius-md);padding:24px 26px;margin-bottom:30px;}
        .industries-box .head{display:flex;align-items:center;gap:10px;font-family:var(--font-display);font-weight:700;font-size:15.5px;margin-bottom:16px;}
        .pill-grid{display:flex;flex-wrap:wrap;gap:10px;}
        .pill{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.88);font-size:13.5px;font-weight:600;padding:9px 15px;border-radius:999px;}
        .mini-stat-row{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
        .mini-stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:var(--radius-md);padding:22px;}
        .mini-stat .icon{margin-bottom:14px;color:var(--blue-300);}
        .mini-stat .num{font-family:var(--font-display);font-weight:800;font-size:24px;}
        .mini-stat .label{font-size:13px;color:rgba(255,255,255,.65);margin-top:3px;}
        /* ── Contact ── */
        .contact{background:var(--ice-50);padding:100px 0 110px;}
        .contact-card{max-width:680px;margin:0 auto;background:var(--white);border-radius:24px;padding:44px;box-shadow:var(--shadow-soft);border:1px solid #e7f0f8;}
        .field{margin-bottom:18px;}
        .field label{display:block;font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px;}
        .input-shell{display:flex;align-items:center;gap:10px;border:1.5px solid #d6e7f4;border-radius:var(--radius-sm);padding:13px 16px;background:var(--ice-50);transition:border-color .2s,background .2s;}
        .input-shell:focus-within{border-color:var(--blue-500);background:var(--white);}
        .input-shell svg{flex-shrink:0;color:var(--blue-600);}
        .input-shell input,.input-shell select,.input-shell textarea{border:none;background:transparent;font-family:inherit;font-size:14.5px;color:var(--ink);width:100%;outline:none;resize:none;}
        .input-shell select{appearance:none;cursor:pointer;}
        .field textarea{min-height:96px;}
        /* ── OTP step box ── */
        .otp-step{background:linear-gradient(135deg,#f0f9ff,#e8f4fd);border:1.5px solid #bfe0f7;border-radius:var(--radius-md);padding:28px;margin-bottom:24px;}
        .otp-step h3{font-family:var(--font-display);font-weight:700;font-size:17px;color:var(--ink);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
        .otp-step p{font-size:14px;color:var(--slate);margin-bottom:18px;}
        .otp-boxes{display:flex;gap:10px;justify-content:center;margin-bottom:16px;}
        .otp-single-input{width:100%;padding:13px 16px;border:1.5px solid #d6e7f4;border-radius:var(--radius-sm);font-size:22px;font-weight:700;text-align:center;letter-spacing:8px;font-family:var(--font-display);color:var(--ink);background:var(--white);outline:none;transition:border-color .2s;}
        .otp-single-input:focus{border-color:var(--blue-500);}
        .btn-send-otp{width:100%;padding:14px;border-radius:999px;background:linear-gradient(90deg,var(--blue-600),var(--blue-500));color:var(--white);font-family:var(--font-display);font-weight:700;font-size:15px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 20px -8px rgba(47,109,163,.55);}
        .btn-send-otp:hover:not(:disabled){transform:translateY(-2px);}
        .btn-send-otp:disabled{opacity:.6;cursor:not-allowed;}
        .btn-verify-otp{width:100%;padding:14px;border-radius:999px;background:linear-gradient(90deg,#1a8a44,#22a855);color:var(--white);font-family:var(--font-display);font-weight:700;font-size:15px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 20px -8px rgba(26,138,68,.5);transition:transform .2s;}
        .btn-verify-otp:hover:not(:disabled){transform:translateY(-2px);}
        .btn-verify-otp:disabled{opacity:.6;cursor:not-allowed;}
        .resend-row{text-align:center;margin-top:12px;font-size:14px;color:var(--slate);}
        .resend-link{color:var(--blue-600);font-weight:700;cursor:pointer;background:none;border:none;font-family:inherit;font-size:inherit;}
        .resend-link:disabled{color:var(--slate-light);cursor:not-allowed;}
        .verified-badge{display:flex;align-items:center;gap:10px;background:#d4edda;border:1px solid #a8d5b5;border-radius:var(--radius-sm);padding:14px 18px;margin-bottom:18px;color:#155724;font-weight:600;font-size:14px;}
        .alert-err{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--radius-sm);padding:12px 16px;color:#991b1b;font-size:14px;margin-bottom:14px;}
        /* ── Payment ── */
        .payment-section{background:linear-gradient(135deg,#f0f9ff,#e8f4fd);border:1.5px solid #bfe0f7;border-radius:var(--radius-md);padding:28px;margin-bottom:24px;}
        .payment-section h3{font-family:var(--font-display);font-weight:700;font-size:17px;color:var(--ink);margin-bottom:6px;}
        .payment-section p{font-size:14px;color:var(--slate);margin-bottom:20px;}
        .payment-amount{display:flex;align-items:center;justify-content:space-between;background:var(--white);border:1px solid #d6e7f4;border-radius:var(--radius-sm);padding:16px 20px;margin-bottom:18px;}
        .payment-amount .amt-label{font-size:13.5px;color:var(--slate);font-weight:600;}
        .payment-amount .amt-value{font-family:var(--font-display);font-weight:800;font-size:26px;color:var(--navy-900);}
        .btn-pay{width:100%;background:linear-gradient(90deg,#1a8a44,#22a855);color:var(--white);font-family:var(--font-display);font-weight:700;font-size:15px;padding:16px 24px;border-radius:999px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 26px -8px rgba(26,138,68,.45);transition:transform .2s;}
        .btn-pay:hover{transform:translateY(-2px);}
        .payment-badge{display:flex;align-items:center;gap:8px;justify-content:center;font-size:12.5px;color:var(--slate);margin-top:12px;}
        .whatsapp-box{background:linear-gradient(135deg,#e8f8ef,#d4f1e0);border:1.5px solid #a8d5b5;border-radius:var(--radius-md);padding:28px;text-align:center;margin-bottom:24px;}
        .whatsapp-box p{font-size:15px;color:#155724;margin-bottom:16px;font-weight:600;}
        .btn-whatsapp{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(90deg,#25d366,#128c7e);color:var(--white);font-family:var(--font-display);font-weight:700;font-size:15px;padding:16px 28px;border-radius:999px;box-shadow:0 10px 26px -8px rgba(37,211,102,.45);cursor:pointer;border:none;transition:transform .2s;}
        .btn-whatsapp:hover{transform:translateY(-2px);}
        .step-indicator{display:flex;align-items:center;gap:8px;margin-bottom:24px;font-size:13px;color:var(--slate);}
        .step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;}
        .step-dot.done{background:#16a34a;color:white;}
        .step-dot.active{background:var(--blue-600);color:white;}
        .step-dot.pending{background:#e1f0fa;color:var(--slate);}
        .step-line{flex:1;height:2px;background:#e1f0fa;}
        .step-line.done{background:#16a34a;}
        .helper{text-align:center;font-size:13px;color:var(--slate-light);margin-top:16px;}
        footer{background:var(--navy-900);color:rgba(255,255,255,.85);padding:64px 0 36px;text-align:center;}
        .footer-brand .brand-name{font-size:20px;}
        footer .tagline{color:rgba(255,255,255,.55);font-size:14.5px;margin-bottom:26px;}
        .footer-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:30px;}
        .footer-pill{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);padding:11px 20px;border-radius:999px;font-weight:600;font-size:14px;transition:background .2s,transform .2s;cursor:pointer;}
        .footer-pill:hover{background:rgba(255,255,255,.14);transform:translateY(-2px);}
        footer .legal{font-size:12.5px;color:rgba(255,255,255,.4);border-top:1px solid rgba(255,255,255,.08);padding-top:24px;}
        .reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease;}
        .reveal.in-view{opacity:1;transform:translateY(0);}
        @media(max-width:900px){
          nav.primary-nav{display:none;position:absolute;top:78px;left:0;right:0;background:var(--navy-900);flex-direction:column;padding:16px 28px 24px;border-bottom:1px solid rgba(255,255,255,.1);}
          nav.primary-nav.open{display:flex;}
          .menu-toggle{display:flex;}
          .card-grid{grid-template-columns:1fr;}
          .category-grid{grid-template-columns:1fr 1fr;}
          .about-grid{grid-template-columns:1fr;}
          .mini-stat-row{grid-template-columns:1fr;}
        }
        @media(max-width:560px){
          .category-grid{grid-template-columns:1fr;}
          .contact-card{padding:28px 20px;}
          .hero{padding:80px 0 60px;min-height:auto;}
        }
        @keyframes spin{to{transform:rotate(360deg);}}
        .spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;}
      `}</style>

      {/* HEADER */}
      <header>
        <div className="wrap">
          <div className="nav-row">
            <div className="brand-name">NAMMA COACH</div>
            <nav className="primary-nav" id="primaryNav">
              <a href="#services" className="nav-link">Services</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>
            <div className="header-actions">
              {isLoggedIn ? (
                <button className="profile-pill" onClick={() => navigate('/dashboard')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>
                  <span>{user?.full_name?.split(' ')[0]}</span>
                </button>
              ) : (
                <button className="login-btn" onClick={() => navigate('/login')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>
                  Sign In
                </button>
              )}
              <button className="menu-toggle" id="menuToggle" aria-label="Menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="wrap">
          <div className="hero-inner">
            <span className="eyebrow"><span className="dot" />Career Guidance &amp; Mentorship</span>
            <h1>Find Your Path with <span className="accent">Expert Coaching</span></h1>
            <p className="lede">From choosing the right course to landing your dream job — NAMMA COACH guides you every step with 18 years of real-world experience.</p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <a href="#about" className="btn btn-ghost">Meet Your Coach</a>
            </div>
            <div className="stat-row">
              <div className="stat-card"><span className="num">500+</span><div className="label">Students guided</div></div>
              <div className="stat-card"><span className="num">18 Yrs</span><div className="label">Industry experience</div></div>
              <div className="stat-card"><span className="num">6</span><div className="label">Industries covered</div></div>
              <div className="stat-card"><span className="num">100%</span><div className="label">Personal sessions</div></div>
            </div>
            <div className="scroll-hint">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow on-light"><span className="dot" style={{background:'var(--blue-600)'}} />What We Help With</span>
            <h2>Your Challenges, Our Expertise</h2>
            <p>Whatever career crossroads you're facing, we have the guidance and tools to help you move forward with clarity.</p>
          </div>
          <div className="card-grid" id="cardGrid" />
          <div className="category-grid">
            {[
              {label:'School & College', img:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80&auto=format&fit=crop'},
              {label:'Working Professionals', img:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80&auto=format&fit=crop'},
              {label:'Life & Happiness', img:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80&auto=format&fit=crop'},
            ].map(c => (
              <div className="category-tile" key={c.label}>
                <img src={c.img} alt={c.label} loading="lazy" />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Your Coach</span>
            <h2>Meet S.P. Balaji</h2>
            <p>18 years of management experience across 6 major industries, now dedicated entirely to your career.</p>
          </div>
          <div className="about-grid">
            <div>
              <div className="coach-photo">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop" alt="S.P. Balaji" />
              </div>
              <div className="coach-card">
                <h4>S.P. Balaji</h4>
                <p>Career Coach &amp; Industry Expert</p>
                <div className="badge-row">
                  <span className="badge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>
                    18 Years as Manager
                  </span>
                </div>
              </div>
            </div>
            <div className="about-copy reveal">
              <p className="bio">With 18 years of hands-on management experience across diverse industries, S.P. Balaji brings unparalleled insight into career decisions, professional growth, and life fulfilment. Born and raised in Sathyamangalam, Erode, he pursued both UG and PG in Biotechnology and has since led teams and guided careers across six major industries.</p>
              <div className="industries-box">
                <div className="head">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Industries Worked In
                </div>
                <div className="pill-grid">
                  {['Research Labs','Food Processing','Medical Devices','Personal Care Products','Software Company','Biotechnology'].map(p=><span className="pill" key={p}>{p}</span>)}
                </div>
              </div>
              <div className="mini-stat-row">
                <div className="mini-stat">
                  <div className="icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                  <span className="num">100s</span><div className="label">One-on-one mentorship sessions</div>
                </div>
                <div className="mini-stat">
                  <div className="icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                  <span className="num">6</span><div className="label">Industries mastered firsthand</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT + OTP + PAYMENT */}
      <section className="contact" id="contact">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow on-light">Get in Touch</span>
            <h2>Start Your Journey Today</h2>
            <p>Fill your details, verify your email with OTP, then pay ₹999 to unlock your WhatsApp coaching session.</p>
          </div>

          <div className="contact-card reveal">

            {/* Step indicator */}
            <div className="step-indicator">
              <div className={`step-dot ${otpVerified ? 'done' : otpSent ? 'done' : 'active'}`}>1</div>
              <div className={`step-line ${otpSent ? 'done' : ''}`} />
              <div className={`step-dot ${otpVerified ? 'done' : otpSent ? 'active' : 'pending'}`}>2</div>
              <div className={`step-line ${otpVerified ? 'done' : ''}`} />
              <div className={`step-dot ${payDone ? 'done' : otpVerified ? 'active' : 'pending'}`}>3</div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--slate)',marginBottom:24,marginTop:-8}}>
              <span>Your Details</span><span style={{marginLeft:40}}>Verify OTP</span><span>Payment</span>
            </div>

            {/* ── STEP 1: Details form ── */}
            {!otpSent && (
              <>
                {formError && (
                  <div className="alert-err">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {formError}
                  </div>
                )}
                <div className="field">
                  <label>What is your challenge?</label>
                  <div className="input-shell">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="9"/></svg>
                    <select name="challenge" value={formData.challenge} onChange={handleFormChange}>
                      <option value="">Select your challenge...</option>
                      <option>I'm unsure which course or degree to pursue.</option>
                      <option>I want help finding my hidden strengths.</option>
                      <option>I need guidance choosing my science stream.</option>
                      <option>I feel stuck and need direction.</option>
                      <option>I'm confused between two job offers.</option>
                      <option>I want to live a happier, more fulfilled life.</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Full Name *</label>
                  <div className="input-shell">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>
                    <input type="text" name="name" placeholder="Your full name" value={formData.name} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="field">
                  <label>Email Address * <span style={{fontWeight:500,color:'var(--slate-light)'}}>(OTP will be sent here)</span></label>
                  <div className="input-shell">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
                    <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="field">
                  <label>Phone Number *</label>
                  <div className="input-shell">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <input type="tel" name="phone" placeholder="Your phone number" value={formData.phone} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="field">
                  <label>Message <span style={{fontWeight:500,color:'var(--slate-light)'}}>(optional)</span></label>
                  <div className="input-shell" style={{alignItems:'flex-start'}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginTop:2}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <textarea name="message" placeholder="Your message or additional details..." value={formData.message} onChange={handleFormChange} />
                  </div>
                </div>
                <button className="btn-send-otp" onClick={handleSendOtp} disabled={otpLoading}>
                  {otpLoading ? <span className="spinner" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>}
                  {otpLoading ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              </>
            )}

            {/* ── STEP 2: OTP Verification ── */}
            {otpSent && !otpVerified && (
              <div className="otp-step">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f6da3" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
                  Check Your Email
                </h3>
                <p>We sent a 6-digit OTP to <strong>{formData.email}</strong>. Enter it below to verify.</p>

                {otpError && (
                  <div className="alert-err" style={{marginBottom:14}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {otpError}
                  </div>
                )}

                <input
                  className="otp-single-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpError(''); }}
                  autoFocus
                />

                <button className="btn-verify-otp" style={{marginTop:14}} onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 6}>
                  {otpLoading ? <span className="spinner" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <div className="resend-row">
                  {countdown > 0
                    ? <>Resend in <strong style={{color:'var(--blue-600)'}}>{countdown}s</strong></>
                    : <>Didn't get it? <button className="resend-link" onClick={handleResend} disabled={otpLoading}>Resend OTP</button></>
                  }
                </div>

                <div style={{textAlign:'center',marginTop:12}}>
                  <button onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); }} style={{background:'none',border:'none',color:'var(--slate)',fontSize:13,cursor:'pointer',textDecoration:'underline'}}>
                    ← Change details
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Payment ── */}
            {otpVerified && (
              <>
                {!payDone ? (
                  <>
                    <div className="verified-badge">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Email verified! You can now proceed to payment.
                    </div>
                    <div className="payment-section">
                      <h3>🔒 Secure Payment</h3>
                      <p>Complete payment to unlock your personalised WhatsApp coaching session with NAMMA COACH.</p>
                      <div className="payment-amount">
                        <span className="amt-label">Session Fee</span>
                        <span className="amt-value">₹999</span>
                      </div>
                      <button className="btn-pay" onClick={handlePay}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        Pay ₹999 via Razorpay
                      </button>
                      <div className="payment-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        256-bit SSL encrypted · Razorpay secured · Instant confirmation
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="whatsapp-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{margin:'0 auto 12px'}}><path d="M20 6L9 17l-5-5"/></svg>
                    <p>✅ Payment of ₹999 successful!<br />Click below to start your WhatsApp coaching session.</p>
                    <button className="btn-whatsapp" onClick={handleWhatsApp}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.054 23.272a.75.75 0 0 0 .921.921l5.417-1.478A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.95-1.352l-.355-.212-3.682 1.003 1.003-3.682-.212-.355A9.713 9.713 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                      Chat on WhatsApp Now
                    </button>
                  </div>
                )}
              </>
            )}

            {!otpSent && <p className="helper">Fill your details above and click "Send OTP to Email" to get started</p>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="footer-brand"><div className="brand-name">NAMMA COACH</div></div>
          <p className="tagline">Your Career Guidance Partner</p>
          <div className="footer-actions">
            <a className="footer-pill" id="footerWhatsapp" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp
            </a>
            <a className="footer-pill" href="tel:+919944920584">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              +91 99449 20584
            </a>
            <button className="footer-pill" onClick={() => navigate('/login')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>
              {isLoggedIn ? 'My Account' : 'Sign In / Register'}
            </button>
          </div>
          <p className="legal">&copy; <span id="year" /> NAMMA COACH. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
