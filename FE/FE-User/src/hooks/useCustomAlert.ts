import { useState, useCallback } from 'react';

interface AlertConfig {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  onClose?: () => void;
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (alertConfig?.onClose) {
        alertConfig.onClose();
      }
      setAlertConfig(null);
    }, 300);
  }, [alertConfig]);

  return {
    alertConfig,
    visible,
    showAlert,
    hideAlert,
  };
};

