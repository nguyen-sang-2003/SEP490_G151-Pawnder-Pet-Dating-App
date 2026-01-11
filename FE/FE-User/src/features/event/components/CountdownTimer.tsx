import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, typography } from '../../../theme';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  onExpire?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * CountdownTimer Component
 * Modern countdown display with animated feel
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label,
  onExpire,
}) => {
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = new Date().getTime();
    
    // Parse target date - Backend returns time without timezone, treat as Vietnam time
    let target: number;
    if (targetDate.endsWith('Z') || targetDate.includes('+') || targetDate.includes('-', 10)) {
      target = new Date(targetDate).getTime();
    } else {
      target = new Date(targetDate + '+07:00').getTime();
    }
    
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
  }, [targetDate]);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      if (newTime.isExpired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeRemaining, onExpire]);

  if (timeRemaining.isExpired) {
    return (
      <View style={styles.container}>
        <View style={styles.expiredBadge}>
          <Icon name="checkmark-circle" size={14} color="#4CAF50" />
          <Text style={styles.expiredText}>Đã kết thúc</Text>
        </View>
      </View>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.timeContainer}>
        {timeRemaining.days > 0 && (
          <>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{timeRemaining.days}</Text>
              <Text style={styles.timeUnit}>ngày</Text>
            </View>
            <Text style={styles.separator}>:</Text>
          </>
        )}
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{formatNumber(timeRemaining.hours)}</Text>
          <Text style={styles.timeUnit}>giờ</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{formatNumber(timeRemaining.minutes)}</Text>
          <Text style={styles.timeUnit}>phút</Text>
        </View>
        {timeRemaining.days === 0 && (
          <>
            <Text style={styles.separator}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={[styles.timeValue, styles.secondsValue]}>
                {formatNumber(timeRemaining.seconds)}
              </Text>
              <Text style={styles.timeUnit}>giây</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 28,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    fontVariant: ['tabular-nums'],
  },
  secondsValue: {
    color: colors.primary,
  },
  timeUnit: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: '500',
    marginTop: -2,
  },
  separator: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginHorizontal: 1,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default CountdownTimer;
