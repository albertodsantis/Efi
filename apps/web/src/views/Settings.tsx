import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TextAlignLeft,
  Bell,
  CalendarBlank,
  CaretDown,
  SignOut,
  Chat,
  DownloadSimple,
  Envelope,
  LockKey,
  Moon,
  PencilLine,
  Plus,
  ArrowCounterClockwise,
  Sparkle,
  Sun,
  Trash,
  TextT,
  UserMinus,
  Alarm,
  CurrencyCircleDollar,
  Translate,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isPro, trialDaysRemaining } from '@shared';
import type { Locale } from '@shared';
import {
  requestNotificationPermission,
  scheduleDueDateReminders,
  cancelAllReminders,
} from '../lib/localNotifications';
import { useAppContext } from '../context/AppContext';
import OverlayModal from '../components/OverlayModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ReferralsSection from '../components/ReferralsSection';
import UpgradeModal from '../components/UpgradeModal';
import {
  Button,
  EmptyState,
  ModalPanel,
  SettingRow,
  StatusBadge,
  SurfaceCard,
  ToggleSwitch,
  cx,
} from '../components/ui';
import { authApi, calendarApi } from '../lib/api';
import { toast } from '../lib/toast';
import { ACCENT_OPTIONS, getSwatchCss } from '../lib/accent';
import { exportUserData } from '../lib/exportData';

const TEMPLATE_VARIABLE_KEYS = [
  'brandName',
  'contactName',
  'creatorName',
  'deliverable',
  'mediaKitLink',
] as const;

const fieldClass =
  'w-full rounded-[1rem] border border-[color:var(--line-soft)] bg-[var(--surface-card-strong)] px-4 py-3.5 text-base sm:text-sm font-medium text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)]/70 focus:bg-white/96 focus:outline-none focus:ring-2 dark:focus:bg-[var(--surface-card)]';

export default function Settings() {
  const {
    accentColor,
    accentHex,
    accentGradient,
    setAccentColor,
    email,
    provider,
    onProviderChange,
    profile,
    updateProfile,
    templates,
    addTemplate,
    deleteTemplate,
    theme,
    setTheme,
    reportActionError,
    onLogout,
    tasks,
    partners,
    profileAccentColor,
    profileForceDark,
    planState,
    pipelineHasCobrado,
    setPipelineHasCobrado,
    locale,
    setLocale,
  } = useAppContext();
  const { t } = useTranslation('settings');
  const [savingLocale, setSavingLocale] = useState(false);

  const handleLocaleChange = async (next: Locale) => {
    if (next === locale || savingLocale) return;
    setSavingLocale(true);
    try {
      await setLocale(next);
    } catch {
      reportActionError(t('preferences.language.savingError'));
    } finally {
      setSavingLocale(false);
    }
  };
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const planIsPro = useMemo(() => isPro(planState), [planState]);
  const trialDays = useMemo(() => trialDaysRemaining(planState), [planState]);
  const planBadgeLabel = planState.earlyAccess
    ? t('plan.badges.earlyAccess')
    : planIsPro
      ? t('plan.badges.pro')
      : t('plan.badges.free');
  const planDescription = planState.earlyAccess
    ? t('plan.description.earlyAccess')
    : planState.subscribedUntil
      ? t('plan.description.subscribed', {
          date: new Date(planState.subscribedUntil).toLocaleDateString(
            locale === 'en' ? 'en-US' : 'es-AR',
          ),
        })
      : trialDays !== null && trialDays > 0
        ? t('plan.description.trial', { days: trialDays })
        : t('plan.description.free');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(
    () => localStorage.getItem('efi_task_reminders_enabled') !== 'false',
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isAccentPaletteOpen, setIsAccentPaletteOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', body: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountName, setAccountName] = useState(profile.name);
  const [showCobradoConfirm, setShowCobradoConfirm] = useState(false);
  const [togglingCobrado, setTogglingCobrado] = useState(false);
  const cobradoTaskCount = useMemo(
    () => tasks.filter((t) => t.status === 'Cobrado').length,
    [tasks],
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const SECTIONS = useMemo(
    () => [
      { id: 'plan', label: t('sections.plan') },
      { id: 'referrals', label: t('sections.referrals') },
      { id: 'templates', label: t('sections.templates') },
      { id: 'pipeline', label: t('sections.pipeline') },
      { id: 'appearance', label: t('sections.appearance') },
      { id: 'onboarding', label: t('sections.onboarding') },
      { id: 'preferences', label: t('sections.preferences') },
      { id: 'account', label: t('sections.account') },
    ],
    [t],
  );
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsScrollerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef<number | null>(null);

  const getScrollContainer = (el: HTMLElement): HTMLElement | Window => {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return window;
  };

  useEffect(() => {
    const elements = SECTIONS
      .map((s) => sectionRefs.current[s.id])
      .filter((el): el is HTMLElement => el != null);
    if (elements.length === 0) return;

    const tabsHeight = tabsRef.current?.offsetHeight ?? 56;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: `-${tabsHeight + 8}px 0px -55% 0px`, threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [SECTIONS]);

  useEffect(() => {
    const scroller = tabsScrollerRef.current;
    if (!scroller) return;
    const activeBtn = scroller.querySelector<HTMLButtonElement>(
      `button[data-section-id="${activeSection}"]`,
    );
    if (!activeBtn) return;
    const target =
      activeBtn.offsetLeft - scroller.clientWidth / 2 + activeBtn.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    const tabsHeight = tabsRef.current?.offsetHeight ?? 56;
    const offset = tabsHeight + 8;
    const scroller = getScrollContainer(el);

    setActiveSection(id);
    isProgrammaticScroll.current = true;
    if (programmaticScrollTimer.current) {
      window.clearTimeout(programmaticScrollTimer.current);
    }
    programmaticScrollTimer.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);

    if (scroller === window) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      const container = scroller as HTMLElement;
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        offset;
      container.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  useEffect(() => {
    setAccountName(profile.name);
  }, [profile.name]);

  useEffect(() => {
    const target = sessionStorage.getItem('efi:settings_initial_section');
    if (!target) return;
    sessionStorage.removeItem('efi:settings_initial_section');
    // Defer until section refs are mounted.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToSection(target));
    });
  }, []);

  useEffect(() => {
    calendarApi.getStatus().then((res) => setGcalConnected(res.connected)).catch(() => {}).finally(() => setGcalLoading(false));
  }, []);

  const connectGoogleCalendar = async () => {
    try {
      const { url } = await calendarApi.getConnectUrl();
      const popup = window.open(url, 'gcal-auth', 'width=500,height=600');

      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.removeEventListener('message', onMessage);
          setGcalConnected(true);
          toast.success(t('preferences.googleCalendar.connectedToast'));
        }
      };
      window.addEventListener('message', onMessage);

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', onMessage);
        }
      }, 500);
    } catch {
      toast.error(t('preferences.googleCalendar.connectError'));
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await calendarApi.disconnect();
      setGcalConnected(false);
      toast.info(t('preferences.googleCalendar.disconnectedToast'));
    } catch {
      toast.error(t('preferences.googleCalendar.disconnectError'));
    }
  };

  const handleAccountNameBlur = async () => {
    const trimmed = accountName.trim();
    if (trimmed && trimmed !== profile.name) {
      try {
        await updateProfile({ name: trimmed });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t('account.fields.nameUpdateError'));
        setAccountName(profile.name);
      }
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordError(null);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailError(null);
    setEmailSent(false);
    setEmailForm({ newEmail: '', currentPassword: '' });
  };

  const handleChangeEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    setSavingEmail(true);
    try {
      await authApi.changeEmail({
        newEmail: emailForm.newEmail,
        ...(provider === 'email' ? { currentPassword: emailForm.currentPassword } : {}),
      });
      setEmailSent(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : t('account.emailModal.genericError'));
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('account.passwordModal.errors.tooShort'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('account.passwordModal.errors.mismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      const result = await authApi.changePassword({
        ...(provider === 'email' ? { currentPassword: passwordForm.currentPassword } : {}),
        newPassword: passwordForm.newPassword,
      });
      onProviderChange(result.updatedProvider);
      closePasswordModal();
      toast.success(provider === 'google'
        ? t('account.passwordModal.successAdd')
        : t('account.passwordModal.successChange'));
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('account.passwordModal.errors.generic'));
    } finally {
      setSavingPassword(false);
    }
  };

  const insertVariable = useCallback(
    (varKey: string) => {
      const token = `{{${varKey}}}`;
      const el = bodyRef.current;
      if (!el) return;

      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const updated = before + token + after;

      setNewTemplate((prev) => ({ ...prev, body: updated }));

      requestAnimationFrame(() => {
        el.focus();
        const cursor = start + token.length;
        el.setSelectionRange(cursor, cursor);
      });
    },
    [],
  );

  const activeAccent =
    ACCENT_OPTIONS.find((option) => option.value.toLowerCase() === accentColor.toLowerCase()) ?? {
      name: t('appearance.currentAccentName'),
      value: accentColor,
    };

  const toggleNotifications = async () => {
    if (!profile.notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await updateProfile({ notificationsEnabled: true });
          toast.success(t('preferences.notifications.enabledToast'));
        } else {
          reportActionError(t('preferences.notifications.permissionRequired'));
        }
      } else {
        reportActionError(t('preferences.notifications.unsupported'));
      }
      return;
    }

    await updateProfile({ notificationsEnabled: false });
    toast.info(t('preferences.notifications.disabledToast'));
  };

  const toggleTaskReminders = async () => {
    if (taskRemindersEnabled) {
      await cancelAllReminders();
      localStorage.setItem('efi_task_reminders_enabled', 'false');
      setTaskRemindersEnabled(false);
      toast.info(t('preferences.taskReminders.disabledToast'));
    } else {
      const granted = await requestNotificationPermission();
      if (!granted) {
        reportActionError(t('preferences.taskReminders.permissionRequired'));
        return;
      }
      localStorage.setItem('efi_task_reminders_enabled', 'true');
      setTaskRemindersEnabled(true);
      await scheduleDueDateReminders(tasks);
      toast.success(t('preferences.taskReminders.enabledToast'));
    }
  };

  const handleAddTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingTemplate) return;
    setSavingTemplate(true);
    try {
      if (editingTemplateId) {
        await deleteTemplate(editingTemplateId);
        await addTemplate(newTemplate);
        setIsAddingTemplate(false);
        setNewTemplate({ name: '', body: '' });
        setEditingTemplateId(null);
        toast.success(t('templates.toasts.updated'));
      } else {
        await addTemplate(newTemplate);
        setIsAddingTemplate(false);
        setNewTemplate({ name: '', body: '' });
        toast.success(t('templates.toasts.saved'));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('templates.toasts.saveError'));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTour = () => {
    localStorage.removeItem('hasSeenOnboardingTour');
    window.location.reload();
  };

  const handleTogglePipelineCobrado = () => {
    if (pipelineHasCobrado) {
      // Turning off: confirm so the user knows tasks will move to Completada.
      setShowCobradoConfirm(true);
      return;
    }
    void (async () => {
      try {
        await setPipelineHasCobrado(true);
        toast.success(t('pipeline.cobrado.enabledToast'));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('pipeline.cobrado.enableError'));
      }
    })();
  };

  const confirmDisableCobrado = async () => {
    setTogglingCobrado(true);
    try {
      await setPipelineHasCobrado(false);
      setShowCobradoConfirm(false);
      toast.success(
        cobradoTaskCount > 0
          ? t('pipeline.cobrado.disabledToastWithMoves', { count: cobradoTaskCount })
          : t('pipeline.cobrado.disabledToast'),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pipeline.cobrado.disableError'));
    } finally {
      setTogglingCobrado(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportUserData({
        tasks,
        partners,
        profile,
        templates,
        accentColor,
        theme,
        profileAccentColor,
        profileForceDark,
        pipelineHasCobrado,
      });
      toast.success(t('account.export.successToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('account.export.error'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      onLogout();
    } catch {
      reportActionError(t('account.delete.error'));
    }
  };

  return (
    <div className="p-4 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      <div
        ref={tabsRef}
        className="sticky top-0 z-30 -mx-4 mb-5 border-b border-[color:var(--line-soft)] bg-(--surface-card)/95 px-4 backdrop-blur-md lg:-mx-8 lg:mb-6 lg:px-8"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          ref={tabsScrollerRef}
          className="hide-scrollbar flex gap-1 overflow-x-auto py-2"
          role="tablist"
          aria-label={t('tabsAriaLabel')}
        >
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-section-id={section.id}
                onClick={() => scrollToSection(section.id)}
                style={{ touchAction: 'manipulation' }}
                className={cx(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-tight transition-colors',
                  isActive
                    ? 'bg-[var(--accent-soft-strong)] text-[var(--accent-solid)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5 lg:space-y-6">
      <p className="px-1 text-sm text-[var(--text-secondary)]">
        {t('feedback.prefix')}{' '}
        <a
          href="mailto:hola@efidesk.com?subject=Feedback%20Efi"
          className="font-semibold text-[var(--accent-solid)] hover:underline"
        >
          hola@efidesk.com
        </a>
        .
      </p>

      <section id="plan" ref={setSectionRef('plan')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft-strong)] text-[var(--accent-solid)]">
              <Sparkle size={22} weight="fill" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {t('plan.title')}
                </h2>
                <StatusBadge tone={planIsPro ? 'success' : 'neutral'}>{planBadgeLabel}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{planDescription}</p>
            </div>
          </div>
          <Button tone="secondary" onClick={() => setIsUpgradeOpen(true)}>
            {t('plan.viewPlans')}
          </Button>
        </div>
      </SurfaceCard>
      </section>

      {isUpgradeOpen ? <UpgradeModal onClose={() => setIsUpgradeOpen(false)} /> : null}

      <section id="referrals" ref={setSectionRef('referrals')} className="scroll-mt-24">
        <ReferralsSection />
      </section>

      <section id="templates" ref={setSectionRef('templates')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="grid xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
          <div className="p-6 lg:p-7">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <div className="flex shrink-0 items-baseline gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {t('templates.title')}
              </h2>
              <span className="hidden text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500 sm:inline-block">
                {t('templates.eyebrow')}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Button
              accentColor={accentGradient}
              onClick={() => {
                setEditingTemplateId(null);
                setNewTemplate({ name: '', body: '' });
                setIsAddingTemplate(true);
              }}
              className="w-full justify-center"
            >
              <Plus size={16} weight="regular" />
              {t('templates.newButton')}
            </Button>

            <div className="pt-2">
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                {t('templates.variablesEyebrow')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLE_KEYS.map((key) => (
                  <span
                    key={key}
                    className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {t(`templates.variableLabels.${key}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>

          <div className="border-t border-slate-200/70 xl:border-t-0 xl:border-l dark:border-slate-700/60">
          {templates.length > 0 ? (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between gap-4 px-5 py-5 transition-colors hover:bg-[var(--surface-muted)]/55 sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className="mt-0.5 flex shrink-0 items-center justify-center"
                      style={{ color: accentHex }}
                    >
                      <Chat size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {template.name}
                        </h3>
                      </div>
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {template.body}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setNewTemplate({ name: template.name, body: template.body });
                      setIsAddingTemplate(true);
                    }}
                    className="flex shrink-0 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    aria-label={t('templates.editAriaLabel', { name: template.name })}
                  >
                    <PencilLine size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <EmptyState
                icon={Chat}
                title={t('templates.empty.title')}
                description={t('templates.empty.description')}
                action={
                  <Button accentColor={accentGradient} onClick={() => {
                    setEditingTemplateId(null);
                    setNewTemplate({ name: '', body: '' });
                    setIsAddingTemplate(true);
                  }}>
                    <Plus size={16} weight="regular" />
                    {t('templates.empty.create')}
                  </Button>
                }
              />
            </div>
          )}
          </div>
        </div>
      </SurfaceCard>
      </section>

      <section id="pipeline" ref={setSectionRef('pipeline')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="p-6 lg:p-7">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t('pipeline.title')}
          </h2>
          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            {t('pipeline.description')}
          </p>
          <div className="space-y-1">
            <SettingRow
              icon={CurrencyCircleDollar}
              title={t('pipeline.cobrado.title')}
              description={
                pipelineHasCobrado
                  ? t('pipeline.cobrado.descriptionEnabled')
                  : t('pipeline.cobrado.descriptionDisabled')
              }
              onClick={handleTogglePipelineCobrado}
              trailing={<ToggleSwitch checked={pipelineHasCobrado} accentColor={accentGradient} />}
              className="px-0 py-3"
            />
          </div>
        </div>
      </SurfaceCard>
      </section>

      <section id="appearance" ref={setSectionRef('appearance')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="p-6 lg:p-7">
          <button
            type="button"
            onClick={() => setIsAccentPaletteOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
            aria-expanded={isAccentPaletteOpen}
          >
            <div className="flex items-center gap-3">
              <span
                className="block h-11 w-11 rounded-[0.9rem] border-4 border-white shadow-sm dark:border-slate-700"
                style={{ background: getSwatchCss(activeAccent.value) }}
              />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('appearance.themeTitle')}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('appearance.themeCurrent', { name: activeAccent.name })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                {isAccentPaletteOpen ? t('appearance.hide') : t('appearance.show')}
              </p>
              <CaretDown
                size={18}
                className={cx(
                  'ml-auto mt-2 text-slate-400 transition-transform dark:text-slate-500',
                  isAccentPaletteOpen ? 'rotate-180' : '',
                )}
              />
            </div>
          </button>

          {isAccentPaletteOpen ? (
            <div className="mt-4 grid grid-cols-4 gap-3 min-[390px]:grid-cols-5">
              {ACCENT_OPTIONS.map((option) => {
                const isSelected = option.value.toLowerCase() === accentColor.toLowerCase();

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={t('appearance.selectAccentAriaLabel', { name: option.name })}
                    title={option.name}
                    onClick={() => {
                      void setAccentColor(option.value);
                      setIsAccentPaletteOpen(false);
                    }}
                    className="flex items-center justify-center py-1 transition-transform active:scale-95"
                  >
                    <span
                      className={cx(
                        'block h-11 w-11 rounded-[0.9rem] border-4 border-white shadow-sm transition-all dark:border-slate-700',
                        isSelected ? 'scale-110 ring-2 ring-slate-900/20 dark:ring-white/20' : 'hover:scale-105',
                      )}
                      style={{ background: getSwatchCss(option.value) }}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-5 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              title={t('appearance.darkMode.title')}
              description={t('appearance.darkMode.description')}
              onClick={() => void setTheme(theme === 'dark' ? 'light' : 'dark')}
              trailing={<ToggleSwitch checked={theme === 'dark'} accentColor={accentGradient} />}
              className="px-0 py-3"
            />
          </div>
        </div>
      </SurfaceCard>
      </section>

      <section id="onboarding" ref={setSectionRef('onboarding')} className="scroll-mt-24">
      <SettingRow
        icon={ArrowCounterClockwise}
        title={t('onboarding.title')}
        description={t('onboarding.description')}
        onClick={handleResetTour}
        trailing={
          <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
            {t('onboarding.action')}
          </span>
        }
        className="px-2 py-3"
      />
      </section>

      <section id="preferences" ref={setSectionRef('preferences')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="p-6 lg:p-7">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t('preferences.title')}
          </h2>
          <div className="space-y-1">
            <SettingRow
              icon={Translate}
              title={t('preferences.language.title')}
              description={t('preferences.language.description')}
              trailing={
                <div
                  role="group"
                  aria-label={t('preferences.language.title')}
                  className="inline-flex rounded-[0.85rem] border border-(--line-soft) bg-(--surface-card-strong) p-1"
                >
                  {(['es', 'en'] as const).map((lng) => {
                    const isActive = locale === lng;
                    return (
                      <button
                        key={lng}
                        type="button"
                        disabled={savingLocale}
                        onClick={() => void handleLocaleChange(lng)}
                        aria-pressed={isActive}
                        className={cx(
                          'rounded-[0.65rem] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors',
                          isActive
                            ? 'bg-(--surface-card) text-(--text-primary) shadow-sm'
                            : 'text-(--text-secondary) hover:text-(--text-primary)',
                          savingLocale && 'opacity-60',
                        )}
                      >
                        {t(`preferences.language.options.${lng}`)}
                      </button>
                    );
                  })}
                </div>
              }
              className="px-0 py-3"
            />
            <SettingRow
              icon={Bell}
              title={t('preferences.notifications.title')}
              description={t('preferences.notifications.description')}
              onClick={() => void toggleNotifications()}
              trailing={<ToggleSwitch checked={profile.notificationsEnabled} accentColor={accentGradient} />}
              className="px-0 py-3"
            />
            <SettingRow
              icon={Alarm}
              title={t('preferences.taskReminders.title')}
              description={t('preferences.taskReminders.description')}
              onClick={() => void toggleTaskReminders()}
              trailing={<ToggleSwitch checked={taskRemindersEnabled} accentColor={accentGradient} />}
              className="px-0 py-3"
            />
            <SettingRow
              icon={CalendarBlank}
              title={t('preferences.googleCalendar.title')}
              description={gcalConnected ? t('preferences.googleCalendar.descriptionConnected') : t('preferences.googleCalendar.descriptionDisconnected')}
              onClick={gcalLoading ? undefined : gcalConnected ? disconnectGoogleCalendar : connectGoogleCalendar}
              trailing={
                gcalLoading ? (
                  <span className="text-xs text-[var(--text-secondary)]">…</span>
                ) : gcalConnected ? (
                  <StatusBadge tone="success">{t('preferences.googleCalendar.connected')}</StatusBadge>
                ) : (
                  <Button tone="secondary" className="text-xs">{t('preferences.googleCalendar.connect')}</Button>
                )
              }
              className="px-0 py-3"
            />
          </div>
        </div>
      </SurfaceCard>
      </section>

      <section id="account" ref={setSectionRef('account')} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="p-6 lg:p-7">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t('account.title')}
          </h2>
          <div className="mb-5 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                {t('account.fields.nameLabel')}
              </label>
              <input
                value={accountName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountName(e.target.value)}
                onBlur={() => void handleAccountNameBlur()}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder={t('account.fields.namePlaceholder')}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                {t('account.fields.emailLabel')}
              </label>
              <p className="rounded-[1rem] border border-[color:var(--line-soft)] bg-[var(--surface-muted)]/60 px-4 py-3.5 text-base sm:text-sm font-medium text-[var(--text-secondary)]">
                {email || t('account.fields.emailFallback')}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200/70 pt-4 dark:border-slate-700/60" />
          <div className="space-y-1">
            <SettingRow
              icon={Envelope}
              title={t('account.changeEmail.title')}
              description={t('account.changeEmail.description')}
              onClick={() => setIsEmailModalOpen(true)}
              trailing={
                <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                  {t('account.changeEmail.action')}
                </span>
              }
              className="px-0 py-3"
            />
            <SettingRow
              icon={LockKey}
              title={provider === 'google' ? t('account.changePassword.addTitle') : t('account.changePassword.changeTitle')}
              description={
                provider === 'google'
                  ? t('account.changePassword.addDescription')
                  : t('account.changePassword.changeDescription')
              }
              onClick={() => setIsPasswordModalOpen(true)}
              trailing={
                <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                  {provider === 'google' ? t('account.changePassword.add') : t('account.changePassword.change')}
                </span>
              }
              className="px-0 py-3"
            />
            <SettingRow
              icon={DownloadSimple}
              title={t('account.export.title')}
              description={t('account.export.description')}
              onClick={() => void handleExport()}
              trailing={
                <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                  {t('account.export.action')}
                </span>
              }
              className="px-0 py-3"
            />
            <SettingRow
              icon={(props: any) => <SignOut {...props} weight="regular" />}
              title={t('account.logout.title')}
              description={t('account.logout.description')}
              onClick={onLogout}
              trailing={
                <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                  {t('account.logout.action')}
                </span>
              }
              className="px-0 py-3"
            />
            {showDeleteConfirm ? (
              <div className="mt-2 rounded-[1rem] border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/50 dark:bg-rose-950/30">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  {t('account.delete.confirmTitle')}
                </p>
                <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-400/70">
                  {t('account.delete.confirmDescription')}
                </p>
                <div className="mt-4 flex gap-3">
                  <Button
                    tone="danger"
                    onClick={() => void handleDeleteAccount()}
                    className="justify-center"
                  >
                    <Trash size={16} />
                    {t('account.delete.confirm')}
                  </Button>
                  <Button
                    tone="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="justify-center"
                  >
                    {t('account.delete.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <SettingRow
                icon={UserMinus}
                title={t('account.delete.title')}
                description={t('account.delete.description')}
                onClick={() => setShowDeleteConfirm(true)}
                trailing={
                  <span className="text-[11px] font-bold tracking-[0.16em] text-rose-400 uppercase dark:text-rose-500">
                    {t('account.delete.action')}
                  </span>
                }
                className="px-0 py-3"
              />
            )}
          </div>
        </div>
      </SurfaceCard>
      </section>
      </div>

      {isAddingTemplate ? (
        <OverlayModal onClose={() => {
          setIsAddingTemplate(false);
          setEditingTemplateId(null);
        }}>
          <ModalPanel
            title={editingTemplateId ? t('templates.modal.titleEdit') : t('templates.modal.titleNew')}
            description={editingTemplateId ? t('templates.modal.descriptionEdit') : t('templates.modal.descriptionNew')}
            onClose={() => {
              setIsAddingTemplate(false);
              setEditingTemplateId(null);
            }}
            footer={
              <div className="flex w-full gap-3">
                {editingTemplateId && (
                  <Button
                    type="button"
                    tone="danger"
                    onClick={() => {
                      void deleteTemplate(editingTemplateId);
                      setIsAddingTemplate(false);
                      setEditingTemplateId(null);
                      toast.info(t('templates.toasts.deleted'));
                    }}
                    className="px-4"
                    aria-label={t('templates.modal.deleteAriaLabel')}
                  >
                    <Trash size={18} />
                  </Button>
                )}
                <Button type="submit" form="template-form" accentColor={accentGradient} className="flex-1 justify-center" disabled={savingTemplate}>
                  {editingTemplateId ? t('templates.modal.saveEdit') : t('templates.modal.saveNew')}
                </Button>
              </div>
            }
          >
          <form id="template-form" onSubmit={handleAddTemplate} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                  <TextT size={14} />
                  {t('templates.modal.nameLabel')}
                </label>
                <input
                  required
                  value={newTemplate.name}
                  onChange={(event) => setNewTemplate({ ...newTemplate, name: event.target.value })}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                  placeholder={t('templates.modal.namePlaceholder')}
                />
              </div>
            </div>

            <div className="rounded-[1.2rem] border bg-[var(--surface-muted)]/50 p-4 sm:p-5 [border-color:var(--line-soft)]">
              <h4 className="mb-4 text-[11px] font-extrabold tracking-[0.16em] text-[var(--text-primary)] uppercase">
                {t('templates.modal.contentTitle')}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                    <TextAlignLeft size={14} />
                    {t('templates.modal.bodyLabel')}
                  </label>
                  <textarea
                    ref={bodyRef}
                    required
                    value={newTemplate.body}
                    onChange={(event) => setNewTemplate({ ...newTemplate, body: event.target.value })}
                    className={cx(fieldClass, 'min-h-[150px] bg-[var(--surface-card)]')}
                    style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                    placeholder={t('templates.modal.bodyPlaceholder')}
                  />
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/70 uppercase">
                    {t('templates.modal.insertVariable')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_VARIABLE_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => insertVariable(key)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line-soft)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:border-[color:var(--accent)] hover:text-[var(--accent)] active:scale-95"
                      >
                        <span className="text-[10px] opacity-60">{'{{'}</span>
                        {t(`templates.variableLabels.${key}`)}
                        <span className="text-[10px] opacity-60">{'}}'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </form>
          </ModalPanel>
        </OverlayModal>
      ) : null}

      {isEmailModalOpen ? (
        <OverlayModal onClose={closeEmailModal}>
          <ModalPanel
            title={t('account.emailModal.title')}
            description={t('account.emailModal.description')}
            onClose={closeEmailModal}
            footer={
              emailSent ? (
                <Button tone="secondary" onClick={closeEmailModal} className="flex-1 justify-center">
                  {t('account.emailModal.close')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="email-form"
                  accentColor={accentGradient}
                  className="flex-1 justify-center"
                  disabled={savingEmail}
                >
                  {t('account.emailModal.submit')}
                </Button>
              )
            }
          >
            {emailSent ? (
              <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                {t('account.emailModal.successPrefix')} <strong>{emailForm.newEmail}</strong>. {t('account.emailModal.successSuffix')}
              </div>
            ) : (
              <form id="email-form" onSubmit={(e: React.FormEvent) => void handleChangeEmail(e)} className="space-y-4">
                {emailError ? (
                  <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400">
                    {emailError}
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                    {t('account.emailModal.newEmailLabel')}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailForm.newEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                    placeholder={t('account.emailModal.newEmailPlaceholder')}
                    autoComplete="email"
                  />
                </div>

                {provider === 'email' && (
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                      {t('account.emailModal.currentPasswordLabel')}
                    </label>
                    <input
                      type="password"
                      required
                      value={emailForm.currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                      className={fieldClass}
                      style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                      placeholder={t('account.emailModal.currentPasswordPlaceholder')}
                      autoComplete="current-password"
                    />
                  </div>
                )}
              </form>
            )}
          </ModalPanel>
        </OverlayModal>
      ) : null}

      {isPasswordModalOpen ? (
        <OverlayModal onClose={closePasswordModal}>
          <ModalPanel
            title={provider === 'google' ? t('account.passwordModal.addTitle') : t('account.passwordModal.changeTitle')}
            description={
              provider === 'google'
                ? t('account.passwordModal.addDescription')
                : t('account.passwordModal.changeDescription')
            }
            onClose={closePasswordModal}
            footer={
              <Button
                type="submit"
                form="password-form"
                accentColor={accentGradient}
                className="flex-1 justify-center"
                disabled={savingPassword}
              >
                {provider === 'google' ? t('account.passwordModal.addSubmit') : t('account.passwordModal.changeSubmit')}
              </Button>
            }
          >
            <form id="password-form" onSubmit={(e: React.FormEvent) => void handleChangePassword(e)} className="space-y-4">
              {passwordError ? (
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400">
                  {passwordError}
                </div>
              ) : null}

              {provider === 'google' ? (
                <div className="rounded-[1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-400">
                  {t('account.passwordModal.googleNotice')}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                    {t('account.passwordModal.currentPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                    placeholder={t('account.passwordModal.currentPasswordPlaceholder')}
                    autoComplete="current-password"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                  {t('account.passwordModal.newPasswordLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                  placeholder={t('account.passwordModal.newPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--text-secondary)]/70 uppercase">
                  {t('account.passwordModal.confirmPasswordLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                  placeholder={t('account.passwordModal.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              </div>
            </form>
          </ModalPanel>
        </OverlayModal>
      ) : null}

      {showCobradoConfirm ? (
        <ConfirmDialog
          title={t('pipeline.confirm.title')}
          description={
            cobradoTaskCount > 0
              ? t('pipeline.confirm.descriptionWithTasks', { count: cobradoTaskCount })
              : t('pipeline.confirm.descriptionEmpty')
          }
          confirmLabel={t('pipeline.confirm.confirmLabel')}
          onConfirm={() => void confirmDisableCobrado()}
          onClose={() => setShowCobradoConfirm(false)}
          isConfirming={togglingCobrado}
        />
      ) : null}
    </div>
  );
}
