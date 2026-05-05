import { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { useLang } from './context/LanguageContext';
import { LoginPage } from './components/LoginPage';
import { SetupStep1 } from './components/setup/SetupStep1';
import { SetupStep2 } from './components/setup/SetupStep2';
import { SetupStep3 } from './components/setup/SetupStep3';
import { Dashboard } from './components/Dashboard';
import { LanguageToggle } from './components/LanguageToggle';

import { generatePrediction } from './utils/predictions';
import type {
  UserData, ApplianceData, UsageData, PredictionResult,
} from './types';
import { Zap, Moon, Sun, LogOut } from 'lucide-react';

type Screen =
  | 'login'
  | 'setup1'
  | 'setup2'
  | 'setup3'
  | 'dashboard';

const DEFAULT_USER: UserData = {
  numberOfPeople: 3,
  historicalBills: [],
  daysHome: 30,
};

// ── Shared top bar used on setup screens ──────────────────────────────
function TopBar({
  darkMode,
  onToggleDark,
  onLogout,
  showLogout = false,
}: {
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
}) {
  const { t } = useLang();
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm text-gray-800 dark:text-white">{t.appName}</span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <button
          onClick={onToggleDark}
          className="p-2 rounded-md hover:bg-muted transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {showLogout && onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-md hover:bg-muted transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

// ── Step progress indicator ────────────────────────────────────────────
function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useLang();
  const steps = [t.historicalBills, t.appliances, t.usageHours];
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done   = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              active ? 'bg-blue-600 text-white shadow' :
              done   ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                       'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                active ? 'bg-white text-blue-600' :
                done   ? 'bg-green-500 text-white' :
                         'bg-gray-300 text-gray-500 dark:bg-gray-600'
              }`}>{done ? '✓' : n}</span>
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 rounded ${done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AppInner() {
  const { t } = useLang();
  const [screen, setScreen]           = useState<Screen>('login');
  const [userData, setUserData]       = useState<UserData>(DEFAULT_USER);
  const [applianceData, setAppliance] = useState<ApplianceData>({});
  const [usageData, setUsage]         = useState<UsageData>({});
  const [prediction, setPrediction]   = useState<PredictionResult | null>(null);
  const [darkMode, setDarkMode]       = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleDarkMode = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
  };

  const handleLogin = (name: string, email: string) => {
    setUserData(prev => ({ ...prev, name, email }));
    setScreen('setup1');
  };

  const handleStep1 = (data: UserData) => {
    setUserData(data);
    setScreen('setup2');
  };

  const handleStep2 = (data: ApplianceData) => {
    setAppliance(data);
    setScreen('setup3');
  };

  const handleStep3 = async (data: UsageData) => {
    setUsage(data);
    setLoading(true);
    try {
      const result = await generatePrediction(userData, applianceData, data);
      setPrediction(result);
    } catch (err) {
      console.error('Prediction failed with unexpected error:', err);
    } finally {
      setLoading(false);
      setScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setScreen('login');
    setPrediction(null);
    setUserData(DEFAULT_USER);
    setAppliance({});
    setUsage({});
  };

  const handleEditSetup = () => {
    setScreen('setup1');
    setPrediction(null);
  };

  if (screen === 'login') {
    return <LoginPage onLogin={handleLogin} darkMode={darkMode} onToggleDark={() => handleDarkMode(!darkMode)} />;
  }

  if (screen === 'setup1') {
    return (
      <div className="min-h-screen bg-background">
        <TopBar darkMode={darkMode} onToggleDark={() => handleDarkMode(!darkMode)} onLogout={handleLogout} showLogout />
        <StepProgress step={1} />
        <div className="flex items-start justify-center p-4">
          <div className="w-full max-w-2xl">
            <SetupStep1 initialData={userData} onComplete={handleStep1} />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'setup2') {
    return (
      <div className="min-h-screen bg-background">
        <TopBar darkMode={darkMode} onToggleDark={() => handleDarkMode(!darkMode)} onLogout={handleLogout} showLogout />
        <StepProgress step={2} />
        <div className="flex items-start justify-center p-4">
          <div className="w-full max-w-2xl">
            <SetupStep2
              initialData={applianceData}
              onComplete={handleStep2}
              onBack={() => setScreen('setup1')}
              baseloadCounts={userData.baseloadCounts}
            />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'setup3') {
    return (
      <div className="min-h-screen bg-background">
        <TopBar darkMode={darkMode} onToggleDark={() => handleDarkMode(!darkMode)} onLogout={handleLogout} showLogout />
        <StepProgress step={3} />
        <div className="flex items-start justify-center p-4">
          <div className="w-full max-w-2xl">
            <SetupStep3
              applianceData={applianceData}
              initialData={usageData}
              onComplete={handleStep3}
              onBack={() => setScreen('setup2')}
              baseloadCounts={userData.baseloadCounts}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Zap className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">{t.analysing}</p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{t.backendError}</p>
          <button onClick={handleLogout} className="text-primary underline text-sm">{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      userData={userData}
      applianceData={applianceData}
      usageData={usageData}
      onEditSetup={handleEditSetup}
      darkMode={darkMode}
      onToggleDark={() => handleDarkMode(!darkMode)}
    />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
