import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { EventStatus, EVENT_STATUS_CONFIG } from '../../../types/event.types';


interface StatusBadgeProps {
  status: EventStatus;
  size?: 'small' | 'medium';
}

const STATUS_ICONS: Record<EventStatus, string> = {
  upcoming: 'time-outline',
  active: 'flash',
  submission_closed: 'lock-closed-outline',
  voting_ended: 'hourglass-outline',
  completed: 'checkmark-circle',
  cancelled: 'close-circle',
};

/**
 * StatusBadge Component
 * Modern badge with icon and status text
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = EVENT_STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  const isSmall = size === 'small';
  const iconName = STATUS_ICONS[status] || 'ellipse';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Icon 
        name={iconName} 
        size={isSmall ? 10 : 12} 
        color={config.color} 
      />
      <Text
        style={[
          styles.text,
          { color: config.color },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
});

export default StatusBadge;
