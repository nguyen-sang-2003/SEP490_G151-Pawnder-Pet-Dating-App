// Currency formatting utilities
export const formatCurrency = (amount, currency = 'VND') => {
  if (amount === null || amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '';
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.NumberFormat('vi-VN', formatOptions).format(number);
  } catch (error) {
    return number.toString();
  }
};
