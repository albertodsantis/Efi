import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppContext } from '../context/AppContext';

export default function OnboardingTour() {
  const { theme, accentColor } = useAppContext();
  const [run, setRun] = useState(false);

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
      showProgress
      showSkipButton
      steps={steps}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: accentColor || '#8b5cf6',
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          textColor: theme === 'dark' ? '#f8fafc' : '#1e293b',
          arrowColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: accentColor || '#8b5cf6',
          borderRadius: '9999px',
          padding: '8px 16px',
          fontWeight: 'bold',
        },
        buttonBack: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          marginRight: '8px',
        },
        buttonSkip: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
        }
      }}
    />
  );
}
