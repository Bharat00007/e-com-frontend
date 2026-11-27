import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/storeServices';
import { useStore } from '../context/StoreContext';
import { ApiError } from '../services/apiClient';

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function maskEmailAddress(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(4, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/account';
  const redirectTo =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/login')
      ? rawRedirect
      : '/account';
  const {
    customer,
    authLoading,
    completeAuthenticatedLogin,
    apiStatus,
    apiErrorMessage,
    retryConnection,
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify-otp'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Email OTP state
  const [pendingEmail, setPendingEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devOtpInfo, setDevOtpInfo] = useState<string | null>(null);
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!authLoading && customer && !submitting && !verifying) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, customer, submitting, verifying, navigate, redirectTo]);

  useEffect(() => {
    if (authMode !== 'verify-otp') return;
    const timer = window.setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [authMode]);

  useEffect(() => {
    if (authMode === 'verify-otp') {
      otpInputsRef.current[0]?.focus();
    }
  }, [authMode]);

  const validateEmailFormat = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return 'Email address is required.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return emailOk ? null : 'Please enter a valid email address.';
  };

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
    setUnverifiedEmail(null);
  };

  const enterOtpMode = (
    email: string,
    masked?: string,
    expiresIn = 300,
    cooldown = 60,
    devOtp?: string
  ) => {
    const normalized = email.trim().toLowerCase();
    setPendingEmail(normalized);
    setMaskedEmail(masked || maskEmailAddress(normalized));
    if (devOtp && devOtp.length === 6) {
      setOtpDigits(devOtp.split(''));
      setDevOtpInfo(devOtp);
    } else {
      setOtpDigits(['', '', '', '', '', '']);
      setDevOtpInfo(null);
    }
    setExpirySeconds(expiresIn);
    setCooldownSeconds(cooldown);
    setAuthMode('verify-otp');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const nextFieldErrors: Record<string, string> = {};
    if (authMode === 'register') {
      const trimmedName = fullName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        nextFieldErrors.fullName = 'Full name must be between 2 and 100 characters.';
      }
      const emailErr = validateEmailFormat(identifier);
      if (emailErr) nextFieldErrors.email = emailErr;

      if (phone.trim()) {
        const cleanedPhone = phone.trim().replace(/[\s\-()]/g, '');
        if (!/^(?:\+?91|0)?([6-9]\d{9})$/.test(cleanedPhone)) {
          nextFieldErrors.phone = 'Please enter a valid 10-digit Indian mobile number.';
        }
      }

      if (password.length < 8 || password.length > 128) {
        nextFieldErrors.password = 'Password must be between 8 and 128 characters.';
      }
    } else {
      if (identifier.trim().length < 3) {
        nextFieldErrors.email = 'Please enter your email address.';
      }
      if (!password) {
        nextFieldErrors.password = 'Please enter your password.';
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMsg(Object.values(nextFieldErrors)[0]);
      return;
    }

    if (apiStatus === 'offline') {
      setErrorMsg(
        apiErrorMessage ||
          'Backend API is currently offline. Start the backend server and PostgreSQL database to continue.'
      );
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'register') {
        const res = await authService.register({
          fullName: fullName.trim(),
          email: identifier.trim().toLowerCase(),
          phone: phone.trim() ? phone.trim() : undefined,
          password,
          marketingConsent,
        });
        if (res.verificationRequired) {
          setSuccessMsg(res.message || 'Verification code sent to your email address.');
          enterOtpMode(
            res.email,
            res.maskedEmail,
            res.expiresInSeconds || 300,
            res.resendCooldownSeconds || 60,
            res.devOtp
          );
        }
      } else {
        const res = await authService.login({
          identifier: identifier.trim(),
          password,
          rememberMe,
        });
        const outcome = await completeAuthenticatedLogin(res.customer, {
          alreadyMergedOnLogin: res.cartMerged,
        });
        if (!outcome.sessionVerified) {
          throw new ApiError(
            'Unable to confirm your authenticated session. Please try again.',
            401,
            'SESSION_VERIFY_FAILED'
          );
        }
        setSuccessMsg('Signed in successfully. Redirecting...');
        setSubmitting(false);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          const emailDetails = err.details as { email?: string } | undefined;
          setUnverifiedEmail(
            (typeof emailDetails?.email === 'string' && emailDetails.email) ||
              (identifier.includes('@') ? identifier.trim().toLowerCase() : null)
          );
        } else if (err.details) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.details)) {
            if (Array.isArray(msgs) && msgs.length) {
              mapped[key === 'identifier' ? 'email' : key] = msgs[0];
            }
          }
          setFieldErrors(mapped);
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (digitsOnly.length > 1) {
      const slice = digitsOnly.slice(0, 6).split('');
      setOtpDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < 6; i += 1) {
          next[i] = slice[i] ?? '';
        }
        return next;
      });
      const focusIdx = Math.min(slice.length, 5);
      otpInputsRef.current[focusIdx]?.focus();
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digitsOnly;
      return next;
    });
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const code = otpDigits.join('');
    if (!/^[0-9]{6}$/.test(code)) {
      setErrorMsg('Please enter all 6 numeric digits from your verification email.');
      return;
    }

    setVerifying(true);
    try {
      const res = await authService.verifyOtp({ email: pendingEmail, otp: code });
      const outcome = await completeAuthenticatedLogin(res.customer, {
        alreadyMergedOnLogin: res.cartMerged,
      });
      if (!outcome.sessionVerified) {
        throw new ApiError(
          'Unable to confirm your authenticated session. Please try again.',
          401,
          'SESSION_VERIFY_FAILED'
        );
      }
      setSuccessMsg('Email verified! Your account is now active. Redirecting...');
      setVerifying(false);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'OTP_EXPIRED') {
          setExpirySeconds(0);
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to verify your code. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || cooldownSeconds > 0 || !pendingEmail) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setResending(true);
    try {
      const res = await authService.resendOtp({ email: pendingEmail });
      if (res.devOtp && res.devOtp.length === 6) {
        setOtpDigits(res.devOtp.split(''));
        setDevOtpInfo(res.devOtp);
      } else {
        setOtpDigits(['', '', '', '', '', '']);
      }
      setExpirySeconds(res.expiresInSeconds || 300);
      setCooldownSeconds(res.resendCooldownSeconds || 60);
      setSuccessMsg(res.message || 'A fresh verification code has been sent.');
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.details as { retryAfterSeconds?: number } | undefined;
        if (details?.retryAfterSeconds) {
          setCooldownSeconds(details.retryAfterSeconds);
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to resend verification code. Please try again shortly.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <div className="w-full relative overflow-hidden py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto relative z-10">
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-9 shadow-sm relative">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container text-primary text-label-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                <span>
                  {authMode === 'verify-otp'
                    ? 'Email Verification'
                    : 'Welcome back to The Sniff Co.'}
                </span>
              </div>
            </div>

            {authMode === 'verify-otp' ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-headline-md text-on-surface tracking-tight mb-2.5">
                    Verify Your Email
                  </h1>
                  <p className="text-body-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    We&apos;ve sent a verification code to your email address.
                  </p>
                  <p className="mt-2 text-label-md font-bold text-primary">
                    {maskedEmail}
                  </p>
                </div>

                {apiStatus === 'offline' && (
                  <div
                    className="mb-4 p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] text-body-sm flex items-center justify-between gap-3 shadow-xs"
                    role="alert"
                    data-purpose="offline-alert-banner"
                  >
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-[#c2410c]">Backend Offline</p>
                      <p className="text-xs text-[#9a3412] mt-0.5">
                        {apiErrorMessage || 'Unable to connect to backend server.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => retryConnection()}
                      className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div
                    className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm"
                    role="alert"
                  >
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div
                    className="mb-4 p-3 rounded-xl bg-surface-container text-primary text-body-sm"
                    role="status"
                  >
                    {successMsg}
                  </div>
                )}

                {devOtpInfo && (
                  <div
                    className="mb-4 p-3.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-body-sm space-y-1 shadow-xs"
                    data-purpose="dev-otp-banner"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#047857] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        Development Demo OTP
                      </span>
                      <span className="font-mono font-bold text-sm bg-white/80 px-2 py-0.5 rounded border border-[#a7f3d0]">
                        {devOtpInfo}
                      </span>
                    </div>
                    <p className="text-xs text-[#065f46]/90 leading-relaxed">
                      Auto-populated for instant testing (no SMTP email sent). Click &ldquo;Verify Email&rdquo; below or edit digits to test validation.
                    </p>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-label-md">
                      <span className="text-on-surface font-medium">6-Digit Verification Code</span>
                      <span
                        className={
                          expirySeconds === 0
                            ? 'text-error font-semibold'
                            : 'text-primary-container font-semibold'
                        }
                      >
                        {expirySeconds > 0
                          ? `Expires in ${formatCountdown(expirySeconds)}`
                          : 'Code expired'}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit OTP input">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          aria-label={`Verification digit ${idx + 1}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                          type="text"
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onPaste={handleOtpPaste}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-full h-12 text-center text-lg font-bold bg-surface-container-low text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                        />
                      ))}
                    </div>

                    {expirySeconds === 0 && (
                      <p className="text-xs text-error">
                        Your verification code has expired. Please click Resend OTP below to get a
                        fresh 5-minute code.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || otpDigits.join('').length !== 6}
                    className="w-full py-3.5 px-6 rounded-full bg-primary text-on-primary text-title-sm hover:bg-tertiary transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <span>{verifying ? 'Verifying Email...' : 'Verify Email'}</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-3 text-center pt-4 border-t border-surface-container-high">
                  <button
                    type="button"
                    disabled={resending || cooldownSeconds > 0}
                    onClick={handleResendOtp}
                    className="text-title-sm text-primary-container hover:text-tertiary underline-offset-2 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resending
                      ? 'Sending new code...'
                      : cooldownSeconds > 0
                        ? `Resend OTP in ${cooldownSeconds}s`
                        : 'Resend OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setAuthMode('register');
                    }}
                    className="text-body-sm text-secondary hover:text-on-surface transition-colors"
                  >
                    ← Back to registration form
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-headline-md text-on-surface tracking-tight mb-2.5">
                    {authMode === 'login' ? 'Sign in to your account' : 'Create your parent account'}
                  </h1>
                  <p className="text-body-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    {authMode === 'login'
                      ? 'Manage your litter subscriptions, track recent orders, and access exclusive pet care perks.'
                      : 'Enjoy customized litter frequency, seamless zero-fuss reordering, and priority dispatch.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 p-1 mb-7 bg-surface-container-low rounded-full">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      resetMessages();
                    }}
                    className={
                      authMode === 'login'
                        ? 'py-2 text-center rounded-full text-label-md transition-all duration-200 bg-surface-container-lowest text-primary shadow-sm'
                        : 'py-2 text-center rounded-full text-label-md transition-all duration-200 text-secondary hover:text-on-surface'
                    }
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      resetMessages();
                    }}
                    className={
                      authMode === 'register'
                        ? 'py-2 text-center rounded-full text-label-md transition-all duration-200 bg-surface-container-lowest text-primary shadow-sm'
                        : 'py-2 text-center rounded-full text-label-md transition-all duration-200 text-secondary hover:text-on-surface'
                    }
                  >
                    Create Account
                  </button>
                </div>

                {apiStatus === 'offline' && (
                  <div
                    className="mb-4 p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] text-body-sm flex items-center justify-between gap-3 shadow-xs"
                    role="alert"
                    data-purpose="offline-alert-banner"
                  >
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-[#c2410c]">Backend Offline</p>
                      <p className="text-xs text-[#9a3412] mt-0.5">
                        {apiErrorMessage || 'Unable to connect to backend server.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => retryConnection()}
                      className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div
                    className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-body-sm space-y-2"
                    role="alert"
                  >
                    <p>{errorMsg}</p>
                    {unverifiedEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetEmail = unverifiedEmail;
                          resetMessages();
                          enterOtpMode(targetEmail, maskEmailAddress(targetEmail), 300, 0);
                        }}
                        className="text-label-md font-bold underline text-primary"
                      >
                        Enter verification code for {maskEmailAddress(unverifiedEmail)} →
                      </button>
                    )}
                  </div>
                )}

                {successMsg && (
                  <div
                    className="mb-4 p-3 rounded-xl bg-surface-container text-primary text-body-sm"
                    role="status"
                  >
                    {successMsg}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {authMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="block text-label-md text-on-surface" htmlFor="fullname">
                        Full Name
                      </label>
                      <input
                        id="fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Aarav Sharma"
                        className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg text-body-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest transition-colors"
                      />
                      {fieldErrors.fullName && (
                        <p className="text-xs text-error">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-label-md text-on-surface" htmlFor="identifier">
                      {authMode === 'register' ? 'Email Address' : 'Email Address'}
                    </label>
                    <input
                      id="identifier"
                      type={authMode === 'register' ? 'email' : 'text'}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="aarav.sharma@example.in"
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg text-body-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest transition-colors"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-error">{fieldErrors.email}</p>
                    )}
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="block text-label-md text-on-surface" htmlFor="phone">
                        Mobile Number <span className="text-xs text-secondary font-normal">(For order &amp; delivery updates)</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-secondary text-body-sm font-medium select-none pointer-events-none">
                          +91
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="w-full pl-12 pr-4 py-3 bg-surface-container-low text-on-surface rounded-lg text-body-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest transition-colors"
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-xs text-error">{fieldErrors.phone}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-label-md text-on-surface" htmlFor="password">
                        Password
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() =>
                            setErrorMsg(
                              'Please sign in using your verified email address and password.'
                            )
                          }
                          className="text-label-sm text-primary-container hover:text-tertiary transition-colors underline-offset-2 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your security password"
                        className="w-full pl-4 pr-11 py-3 bg-surface-container-low text-on-surface rounded-lg text-body-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest transition-colors"
                      />
                      <button
                        aria-label="Toggle password visibility"
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 p-1 text-secondary hover:text-on-surface transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-error">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="pt-1.5 pb-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        checked={authMode === 'login' ? rememberMe : marketingConsent}
                        onChange={(e) =>
                          authMode === 'login'
                            ? setRememberMe(e.target.checked)
                            : setMarketingConsent(e.target.checked)
                        }
                        className="mt-0.5 w-4 h-4 rounded accent-[#002c1e]"
                        type="checkbox"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                        {authMode === 'login'
                          ? 'Remember me for 30 days'
                          : 'Send me occasional pet care notes & batch notifications'}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-full bg-primary text-on-primary text-title-sm hover:bg-tertiary transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <span>
                      {submitting
                        ? authMode === 'login'
                          ? 'Signing in...'
                          : 'Sending verification code...'
                        : authMode === 'login'
                          ? 'Sign In to The Sniff Co.'
                          : 'Create Account'}
                    </span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </form>

                <div className="mt-7 text-center pt-5">
                  <p className="text-body-sm text-on-surface-variant">
                    <span>
                      {authMode === 'login'
                        ? "Don't have an account yet?"
                        : 'Already have an account?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode((m) => (m === 'login' ? 'register' : 'login'));
                        resetMessages();
                      }}
                      className="text-title-sm text-primary-container ml-1 hover:text-tertiary underline-offset-2 hover:underline"
                    >
                      {authMode === 'login' ? 'Create one now' : 'Sign in here'}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary-container mb-2">
                <span className="material-symbols-outlined text-[16px]">lock</span>
              </div>
              <span className="text-label-md text-on-surface">End-to-end Encrypted</span>
              <span className="text-label-sm text-secondary mt-0.5">256-bit safe checkout</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary-container mb-2">
                <span className="material-symbols-outlined text-[16px]">pause_circle</span>
              </div>
              <span className="text-label-md text-on-surface">Effortless Pausing</span>
              <span className="text-label-sm text-secondary mt-0.5">
                Modify or pause deliveries
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary-container mb-2">
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
              </div>
              <span className="text-label-md text-on-surface">Priority Pet Care</span>
              <span className="text-label-sm text-secondary mt-0.5">Dedicated WhatsApp team</span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-label-sm text-secondary uppercase tracking-widest">
              Formulation-first pet wellness · Handcrafted in India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
