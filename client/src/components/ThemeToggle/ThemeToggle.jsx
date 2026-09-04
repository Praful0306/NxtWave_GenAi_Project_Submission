import { Sun, Moon, Monitor } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import './ThemeToggle.css';

/**
 * Theme toggle — Light / Dark / System.
 * Animated capsule with three options.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme selection">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          className={`theme-toggle__btn ${theme === value ? 'theme-toggle__btn--active' : ''}`}
          onClick={() => setTheme(value)}
          role="radio"
          aria-checked={theme === value}
          aria-label={`${label} theme`}
          title={label}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
