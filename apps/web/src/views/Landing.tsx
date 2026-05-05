import React, { useEffect, useState } from 'react';
import {
  ChartBar,
  CalendarDots,
  Eye,
  EyeSlash,
  Kanban,
  Sparkle,
  Users,
} from '@phosphor-icons/react';
import type { Locale, SessionUser } from '@shared';
import { Trans, useTranslation } from 'react-i18next';
import { authApi, ApiError } from '../lib/api';
import { captureEvent } from '../lib/posthog';
import { readReferralCode, clearReferralCode } from '../lib/referral';
import { supabase } from '../lib/supabase';
import { cx } from '../components/ui';
import { isSupportedLocale, setI18nLocale } from '../i18n';
import LegalModal, { type LegalPage } from '../components/LegalModal';

type AuthMode = 'login' | 'register' | 'forgot';

// Brand colors — Instagram-style gradient (gold → orange → pink → purple)
const BRAND_GOLD = '#FCAF45';
const BRAND_ORANGE = '#F56040';
const BRAND_PINK = '#E1306C';
const BRAND_PURPLE = '#833AB4';

const FEATURE_KEYS = [
  { id: 'efilink', icon: Eye },
  { id: 'pipeline', icon: Kanban },
  { id: 'directory', icon: Users },
  { id: 'dashboard', icon: ChartBar },
  { id: 'googleCalendar', icon: CalendarDots },
  { id: 'aiAssistant', icon: Sparkle },
] as const;

export default function Landing({
  onLogin,
}: {
  onLogin: (user: SessionUser, isNewRegistration?: boolean) => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const { t, i18n } = useTranslation('landing');
  const currentLocale: Locale = isSupportedLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'es';

  const handleLandingLocaleChange = (next: Locale) => {
    if (next === currentLocale) return;
    void setI18nLocale(next);
  };

  useEffect(() => {
    if (sessionStorage.getItem('efi:auth_network_error')) {
      setServerUnreachable(true);
      sessionStorage.removeItem('efi:auth_network_error');
    }
  }, []);

  const switchMode = (newMode: AuthMode) => {
    captureEvent('landing_cta_clicked', { cta: `switch_to_${newMode}` });
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === 'register' && !name.trim()) return;
    captureEvent('landing_cta_clicked', { cta: mode === 'register' ? 'submit_register' : 'submit_login' });

    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const { user } = await authApi.register({
          email: email.trim(),
          password,
          name: name.trim(),
          referralCode: readReferralCode(),
        });
        if (user) {
          clearReferralCode();
          onLogin(user, true);
        }
      } else {
        const { user } = await authApi.login({
          email: email.trim(),
          password,
        });
        if (user) onLogin(user);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USER_NOT_FOUND') {
        setMode('register');
        setError(t('auth.errors.userNotFound'));
        return;
      }
      setError(err instanceof Error ? err.message : t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setForgotSent(true);
    } catch {
      // Always show success to avoid email enumeration
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    captureEvent('landing_cta_clicked', { cta: 'google_login' });
    if (!supabase) {
      setError(t('auth.errors.googleUnavailable'));
      return;
    }

    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (sbError) {
        setError(t('auth.errors.googleFailed'));
      }
    } catch {
      setError(t('auth.errors.googleFailed'));
    }
  };

  const isLogin = mode === 'login';

  return (
    <div
      className="min-h-[100dvh] bg-[var(--surface-app)] font-sans text-[var(--text-primary)]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Background accents — brand gradient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 right-[-8%] h-96 w-96 rounded-full blur-[100px] opacity-40"
          style={{ backgroundColor: BRAND_ORANGE }}
        />
        <div
          className="absolute bottom-[-5%] left-[-6%] h-80 w-80 rounded-full blur-[100px] opacity-30"
          style={{ backgroundColor: BRAND_PURPLE }}
        />
        <div
          className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: BRAND_PINK }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-0">
          <div className="flex items-center gap-0">
            <span className="group relative inline-flex h-22.5 w-22.5 items-center justify-center">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 bottom-2 h-2.5 w-14 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(63,43,33,0.55),rgba(63,43,33,0)_70%)] animate-mushroom-ground-idle group-hover:[animation-play-state:paused]"
              />
              <img
                src="/brand/isotipo.png?v=2"
                alt=""
                width={90}
                height={90}
                draggable={false}
                className="relative origin-bottom select-none drop-shadow-[0_8px_18px_rgba(63,43,33,0.32)] animate-mushroom-idle group-hover:[animation-play-state:paused]"
              />
            </span>
            <picture>
              <source srcSet="/brand/wordmark-light.png" media="(prefers-color-scheme: dark)" />
              <img src="/brand/wordmark.png" alt="Efi" width={26} height={32} className="select-none" draggable={false} />
            </picture>
          </div>
          <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={t('nav.languageLabel')}
            className="inline-flex rounded-full border border-(--line-soft) bg-(--surface-card)/60 p-0.5 backdrop-blur-sm"
          >
            {(['es', 'en'] as const).map((lng) => {
              const isActive = currentLocale === lng;
              return (
                <button
                  key={lng}
                  type="button"
                  onClick={() => handleLandingLocaleChange(lng)}
                  aria-pressed={isActive}
                  className={cx(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                    isActive
                      ? 'bg-(--surface-card) text-(--text-primary) shadow-sm'
                      : 'text-(--text-secondary) hover:text-(--text-primary)',
                  )}
                >
                  {lng}
                </button>
              );
            })}
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border bg-(--surface-card)/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-secondary) border-(--line-soft) backdrop-blur-sm"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK})`,
                boxShadow: `0 0 8px ${BRAND_PINK}80`,
              }}
            />
            {t('nav.betaBadge')}
            <span aria-hidden className="opacity-40">·</span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK})`,
              }}
            >
              {t('nav.freeBadge')}
            </span>
          </span>
          </div>
        </nav>

        {/* Hero + Login */}
        <div className="mt-2 grid items-start gap-12 sm:mt-4 lg:grid-cols-[1fr_420px] lg:gap-16 xl:grid-cols-[1fr_460px]">
          {/* Left: Hero */}
          <div className="max-w-2xl">
            <h1 className="mt-2 text-[clamp(2.2rem,5.5vw,3.8rem)] font-black leading-[1.08] tracking-tight text-[var(--text-primary)]">
              {t('hero.titlePart1')}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK}, ${BRAND_PURPLE})`,
                }}
              >
                {t('hero.titlePart2')}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-(--text-primary) sm:text-lg sm:leading-8">
              <Trans
                ns="landing"
                i18nKey="hero.subtitle"
                components={{ strong: <strong className="font-semibold" /> }}
              />
            </p>

            {/* Feature grid - visible on desktop below hero */}
            <div className="mt-12 hidden lg:block">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)]/80 uppercase">
                {t('hero.featuresEyebrowDesktop')}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                {FEATURE_KEYS.map(({ id, icon: Icon }) => (
                  <div
                    key={id}
                    className="rounded-[1.05rem] border bg-[var(--surface-card)]/60 p-4 backdrop-blur-sm transition-colors [border-color:var(--line-soft)]"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${BRAND_PURPLE}18`, color: BRAND_PURPLE }}
                    >
                      <Icon size={16} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                      {t(`features.${id}.title`)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      {t(`features.${id}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Auth card */}
          <div id="login" className="w-full lg:sticky lg:top-12">
            <div className="relative overflow-hidden rounded-[1.5rem] border bg-[var(--surface-card-strong)] shadow-[var(--shadow-medium)] backdrop-blur-xl [border-color:var(--line-soft)]">
              {/* Card glow */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at top left, ${BRAND_ORANGE}18 0%, transparent 50%)`,
                }}
              />

              <div className="relative px-6 pb-8 pt-7 sm:px-8 sm:pt-8">
                {/* Mode tabs — hidden in forgot mode */}
                {mode !== 'forgot' && (
                  <div className="flex gap-1 rounded-[0.85rem] border bg-[var(--surface-card)] p-1 [border-color:var(--line-soft)]">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className={cx(
                        'flex-1 rounded-[0.7rem] py-2.5 text-sm font-bold transition-all',
                        isLogin
                          ? 'bg-[var(--surface-card-strong)] shadow-sm text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      {t('auth.tabs.login')}
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className={cx(
                        'flex-1 rounded-[0.7rem] py-2.5 text-sm font-bold transition-all',
                        !isLogin
                          ? 'bg-[var(--surface-card-strong)] shadow-sm text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      {t('auth.tabs.register')}
                    </button>
                  </div>
                )}

                {mode === 'forgot' ? (
                  /* ── Forgot password panel ── */
                  <div className="space-y-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => { switchMode('login'); setForgotSent(false); }}
                        className="mb-4 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {t('forgot.back')}
                      </button>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {t('forgot.title')}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {t('forgot.description')}
                      </p>
                    </div>

                    {forgotSent ? (
                      <div className="rounded-[0.85rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {t('forgot.successMessage')}
                      </div>
                    ) : (
                      <form onSubmit={(e) => void handleForgotPassword(e)} className="space-y-3.5">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                            {t('auth.fields.email.label')}
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.fields.email.placeholder')}
                            required
                            autoComplete="email"
                            className="w-full rounded-[0.85rem] border bg-[var(--surface-card)] px-4 py-3 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 transition-colors focus:bg-[var(--surface-card-strong)] [border-color:var(--line-soft)]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !email.trim()}
                          className="flex w-full items-center justify-center gap-2 rounded-[1rem] px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ backgroundImage: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK}, ${BRAND_PURPLE})` }}
                        >
                          {loading ? t('forgot.submitLoading') : t('forgot.submitIdle')}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                      {isLogin ? t('auth.subtitle.login') : t('auth.subtitle.register')}
                    </p>

                    {serverUnreachable && (
                      <div className="mt-4 rounded-[0.85rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
                        {t('auth.serverUnreachable')}
                      </div>
                    )}

                    {/* Google login */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1rem] border bg-[var(--surface-card)] px-4 py-3.5 text-sm font-bold transition-all hover:shadow-[var(--shadow-soft)] active:scale-[0.98] [border-color:var(--line-soft)]"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                      {t('auth.googleButton')}
                    </button>

                    {/* Divider */}
                    <div className="my-5 flex items-center gap-4">
                      <div className="h-px flex-1 bg-[var(--line-soft)]" />
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--text-secondary)]/60 uppercase">
                        {t('auth.divider')}
                      </span>
                      <div className="h-px flex-1 bg-[var(--line-soft)]" />
                    </div>

                    {/* Email form */}
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
                      {!isLogin ? (
                        <div>
                          <label
                            htmlFor="auth-name"
                            className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]"
                          >
                            {t('auth.fields.name.label')}
                          </label>
                          <input
                            id="auth-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('auth.fields.name.placeholder')}
                            required={!isLogin}
                            autoComplete="name"
                            className="w-full rounded-[0.85rem] border bg-[var(--surface-card)] px-4 py-3 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 transition-colors focus:bg-[var(--surface-card-strong)] [border-color:var(--line-soft)]"
                          />
                        </div>
                      ) : null}

                      <div>
                        <label
                          htmlFor="auth-email"
                          className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]"
                        >
                          {t('auth.fields.email.label')}
                        </label>
                        <input
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('auth.fields.email.placeholder')}
                          required
                          autoComplete="email"
                          className="w-full rounded-[0.85rem] border bg-[var(--surface-card)] px-4 py-3 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 transition-colors focus:bg-[var(--surface-card-strong)] [border-color:var(--line-soft)]"
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label
                            htmlFor="auth-password"
                            className="text-xs font-bold text-[var(--text-secondary)]"
                          >
                            {t('auth.fields.password.label')}
                          </label>
                          {isLogin && (
                            <button
                              type="button"
                              onClick={() => switchMode('forgot')}
                              className="text-[11px] font-bold text-[var(--text-secondary)]/60 hover:text-[var(--text-secondary)] transition-colors"
                            >
                              {t('auth.fields.password.forgotLink')}
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id="auth-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isLogin ? t('auth.fields.password.placeholderLogin') : t('auth.fields.password.placeholderRegister')}
                            required
                            minLength={isLogin ? undefined : 8}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            className="w-full rounded-[0.85rem] border bg-[var(--surface-card)] px-4 py-3 pr-12 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 transition-colors focus:bg-[var(--surface-card-strong)] [border-color:var(--line-soft)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-[var(--text-secondary)]/50 transition-colors hover:text-[var(--text-secondary)]"
                          >
                            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Legal consent — register only */}
                      {!isLogin && (
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--line-soft)] accent-[var(--accent)]"
                          />
                          <span className="text-[11px] leading-5 text-[var(--text-secondary)]/70">
                            {t('auth.consent.prefix')}{' '}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setLegalPage('terms'); }}
                              className="font-bold text-(--text-secondary) underline underline-offset-2 hover:text-(--text-primary) transition-colors"
                            >
                              {t('auth.consent.termsLink')}
                            </button>
                            {' '}{t('auth.consent.and')}{' '}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setLegalPage('privacy'); }}
                              className="font-bold text-(--text-secondary) underline underline-offset-2 hover:text-(--text-primary) transition-colors"
                            >
                              {t('auth.consent.privacyLink')}
                            </button>
                          </span>
                        </label>
                      )}

                      {error ? (
                        <p className="text-xs font-medium text-rose-500">{error}</p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={loading || !email.trim() || !password || (!isLogin && !name.trim())}
                        className="flex w-full items-center justify-center gap-2 rounded-[1rem] px-4 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK}, ${BRAND_PURPLE})`,
                          boxShadow: `0 12px 30px -16px ${BRAND_PINK}80`,
                        }}
                      >
                        {loading
                          ? (isLogin ? t('auth.submit.loginLoading') : t('auth.submit.registerLoading'))
                          : (isLogin ? t('auth.submit.loginIdle') : t('auth.submit.registerIdle'))}
                      </button>
                    </form>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Features - mobile only (below login card) */}
        <div className="mt-12 pb-16 lg:hidden">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)]/80 uppercase">
            {t('hero.featuresEyebrowMobile')}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FEATURE_KEYS.map(({ id, icon: Icon }) => (
              <div
                key={id}
                className="rounded-[1.05rem] border bg-[var(--surface-card)]/60 p-4 backdrop-blur-sm transition-colors [border-color:var(--line-soft)]"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${BRAND_PURPLE}18`, color: BRAND_PURPLE }}
                >
                  <Icon size={16} />
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                  {t(`features.${id}.title`)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  {t(`features.${id}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t py-8 [border-color:var(--line-soft)] lg:mt-16">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-(--text-secondary)/60">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-4">
              {([
                { key: 'terms', page: 'terms' as LegalPage, href: '/terminos' },
                { key: 'privacy', page: 'privacy' as LegalPage, href: '/privacidad' },
                { key: 'cookies', page: 'cookies' as LegalPage, href: undefined },
              ]).map(({ key, page, href }) => (
                <a
                  key={page}
                  href={href ?? '#'}
                  onClick={(e) => { e.preventDefault(); setLegalPage(page); }}
                  className="text-xs text-(--text-secondary)/60 hover:text-(--text-secondary) transition-colors"
                >
                  {t(`footer.links.${key}`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {legalPage && (
        <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />
      )}
    </div>
  );
}
