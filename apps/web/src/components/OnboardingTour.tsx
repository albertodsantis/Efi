import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppContext } from '../context/AppContext';

export default function OnboardingTour() {
  const { theme, accentColor } = useAppContext();
  const [run, setRun] = useState(false);
  const [tooltipWidth, setTooltipWidth] = useState(() =>
    typeof window === 'undefined' ? 360 : Math.min(window.innerWidth - 64, 384),
  );

  useEffect(() => {
    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncTooltipWidth = () => {
      setTooltipWidth(Math.min(window.innerWidth - 64, 384));
    };

    syncTooltipWidth();
    window.addEventListener('resize', syncTooltipWidth);

    return () => window.removeEventListener('resize', syncTooltipWidth);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenOnboardingTour', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: '¡Bienvenido a tu nuevo CRM! Vamos a dar un rápido paseo por las funciones principales.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#nav-dashboard',
      content: 'Aquí tienes un resumen de tu actividad, métricas clave y próximos entregables.',
    },
    {
      target: '#nav-pipeline',
      content: 'Gestiona tus tareas y proyectos. Puedes verlos en formato Kanban, Lista o Calendario.',
    },
    {
      target: '#nav-directory',
      content: 'Tu directorio de marcas y contactos. Mantén toda la información de tus partners organizada aquí.',
    },
    {
      target: '#nav-settings',
      content: 'Personaliza la aplicación a tu gusto. ¡Cambia el color de acento o activa el modo oscuro!',
    },
    {
      target: '#tia-assistant-btn',
      content: 'Conoce a Tía, tu asistente de IA. Pídele que añada tareas, busque contactos o actualice estados por ti.',
      placement: 'top',
    }
  ];

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showSkipButton
      steps={steps}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        nextLabelWithProgress: 'Siguiente',
        skip: 'Saltar',
      }}
      styles={{
        options: {
          zIndex: 10000,
          width: tooltipWidth,
          primaryColor: accentColor || '#8b5cf6',
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          textColor: theme === 'dark' ? '#f8fafc' : '#1e293b',
          arrowColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        },
        tooltip: {
          width: tooltipWidth,
          maxWidth: 'calc(100vw - 4rem)',
          borderRadius: '1.25rem',
          boxSizing: 'border-box',
        },
        tooltipContainer: {
          textAlign: 'left',
          padding: '1rem',
        },
        tooltipContent: {
          overflowWrap: 'anywhere',
        },
        tooltipFooter: {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'space-between',
        },
        buttonNext: {
          backgroundColor: accentColor || '#8b5cf6',
          borderRadius: '9999px',
          padding: '8px 16px',
          fontWeight: 'bold',
          marginLeft: 'auto',
          maxWidth: '100%',
        },
        buttonBack: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          marginRight: 0,
        },
        buttonSkip: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          padding: 0,
        }
      }}
    />
  );
}
