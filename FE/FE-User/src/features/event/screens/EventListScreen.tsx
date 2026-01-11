/**
 * EventListScreen
 * Displays list of events with filter tabs
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchActiveEvents,
  selectEvents,
  selectEventLoading,
  selectEventError,
  clearError,
} from '../eventSlice';
import { EventResponse } from '../../../types/event.types';
import { EventCard } from '../components';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<any, 'EventList'>;

type FilterType = 'all' | 'active' | 'upcoming' | 'completed';

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'Tất cả', icon: 'apps-outline' },
  { key: 'active', label: 'Đang diễn ra', icon: 'flash-outline' },
  { key: 'upcoming', label: 'Sắp tới', icon: 'time-outline' },
  { key: 'completed', label: 'Đã kết thúc', icon: 'checkmark-circle-outline' },
];

const EventListScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const events = useAppSelector(selectEvents);
  const loading = useAppSelector(selectEventLoading);
  const error = useAppSelector(selectEventError);

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Load events on mount and focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchActiveEvents());
      return () => {
        dispatch(clearError());
      };
    }, [dispatch])
  );

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (activeFilter === 'all') return events;
    if (activeFilter === 'active') {
      return events.filter(e => e.status === 'active' || e.status === 'submission_closed');
    }
    if (activeFilter === 'upcoming') {
      return events.filter(e => e.status === 'upcoming');
    }
    if (activeFilter === 'completed') {
      return events.filter(e => e.status === 'completed' || e.status === 'voting_ended');
    }
    return events;
  }, [events, activeFilter]);

  // Count by status
  const counts = React.useMemo(() => ({
    all: events.length,
    active: events.filter(e => e.status === 'active' || e.status === 'submission_closed').length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed' || e.status === 'voting_ended').length,
  }), [events]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchActiveEvents());
    setRefreshing(false);
  }, [dispatch]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    dispatch(clearError());
    dispatch(fetchActiveEvents());
  }, [dispatch]);

  // Navigate to event detail
  const handleEventPress = useCallback(
    (eventId: number) => {
      navigation.navigate('EventDetail', { eventId });
    },
    [navigation]
  );

  // Render event card
  const renderEventCard = useCallback(
    ({ item }: { item: EventResponse }) => (
      <EventCard event={item} onPress={handleEventPress} />
    ),
    [handleEventPress]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: EventResponse) => item.eventId.toString(),
    []
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Icon name="calendar-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>
          {activeFilter === 'all' ? 'Chưa có sự kiện' : 'Không có sự kiện'}
        </Text>
        <Text style={styles.emptyText}>
          {activeFilter === 'all' 
            ? 'Hiện tại chưa có sự kiện nào.\nHãy quay lại sau nhé!'
            : `Không có sự kiện nào ${FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()}`
          }
        </Text>
        <TouchableOpacity style={styles.emptyRefreshBtn} onPress={onRefresh}>
          <Icon name="refresh-outline" size={18} color={colors.primary} />
          <Text style={styles.emptyRefreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = counts[filter.key];
          
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Icon 
                name={filter.icon} 
                size={16} 
                color={isActive ? colors.white : colors.textMedium} 
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render error state
  if (error && !loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={colors.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sự kiện</Text>
            <View style={styles.headerRight} />
          </View>
          
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Icon name="cloud-offline-outline" size={48} color={colors.error} />
            </View>
            <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <LinearGradient colors={gradients.primary} style={styles.retryButtonGradient}>
                <Icon name="refresh-outline" size={18} color={colors.white} />
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sự kiện</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Cuộc thi thú cưng 🐾</Text>
          <Text style={styles.heroSubtitle}>
            Tham gia và giành giải thưởng hấp dẫn!
          </Text>
        </View>

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Loading indicator */}
        {loading && events.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 25,
    paddingBottom: 8,
    backgroundColor: '#FAFBFC',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
  },
  headerRight: {
    width: 36,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  filterContainer: {
    marginBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMedium,
  },
  filterTextActive: {
    color: colors.white,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMedium,
  },
  filterBadgeTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF0F3',
  },
  emptyRefreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default EventListScreen;
