# Design Document - HomeScreen Improvements

## Overview

Thiết kế các cải tiến UI/UX cho HomeScreen trong ứng dụng pet adoption React Native. Mục tiêu là nâng cao trải nghiệm người dùng thông qua skeleton loading, pull-to-refresh, smooth animations, haptic feedback, status badges, và empty state được cải thiện. Các cải tiến này sẽ được implement dần dần, bắt đầu với skeleton loading.

## Architecture

### Component Structure

```
HomeScreen (existing)
├── PetCardSkeleton (new component)
├── StatusBadge (new component)
├── EmptyState (enhanced)
└── Existing components (PetCard, BottomNav, etc.)
```

### State Management

Sử dụng React hooks hiện có trong HomeScreen:
- `loading` state - Đã có, sẽ được sử dụng để trigger skeleton
- `pets` state - Đã có
- `currentIndex` state - Đã có
- Thêm state mới cho pull-to-refresh: `refreshing`

### Animation Libraries

- **React Native Animated API** - Đã được sử dụng cho swipe animations, sẽ mở rộng cho skeleton shimmer và card transitions
- **React Native Reanimated** (optional) - Có thể sử dụng cho animations phức tạp hơn nếu cần
- **React Native Haptic Feedback** - Thư viện mới cần cài đặt

## Components and Interfaces

### 1. PetCardSkeleton Component

Component mới để hiển thị skeleton loading thay thế spinner.

**Props Interface:**
```typescript
interface PetCardSkeletonProps {
  count?: number; // Số lượng skeleton cards (default: 3)
}
```

**Design:**
- Kích thước giống pet card thật: `CARD_WIDTH x CARD_HEIGHT`
- Layout bao gồm:
  - Image placeholder (phần trên, chiếm ~70% chiều cao)
  - Info section placeholder (phần dưới, chiếm ~30% chiều cao)
    - Name placeholder (2 lines)
    - Meta info placeholder (1 line)
    - Bio placeholder (2-3 lines)
- Shimmer animation: gradient di chuyển từ trái sang phải, duration 1.5s, loop vô hạn
- Background: Light gray (#E0E0E0) với shimmer overlay (#F5F5F5)
- Border radius: `radius.xl` để match với pet card

**Animation:**
```typescript
// Shimmer effect using Animated.Value
const shimmerAnimation = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.timing(shimmerAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    })
  ).start();
}, []);

const translateX = shimmerAnimation.interpolate({
  inputRange: [0, 1],
  outputRange: [-CARD_WIDTH, CARD_WIDTH],
});
```

### 2. Pull-to-Refresh Integration

Sử dụng `RefreshControl` từ React Native.

**Implementation:**
- Wrap `cardsContainer` trong `ScrollView` với `RefreshControl`
- State: `refreshing` boolean
- Handler: `onRefresh` - Gọi `loadPets()` và set `refreshing = true`
- Khi load xong, set `refreshing = false`

**Considerations:**
- Cần test kỹ để đảm bảo không conflict với swipe gestures của pet cards
- Có thể cần adjust `PanResponder` để chỉ trigger khi swipe horizontal, không vertical

### 3. Enhanced Card Animations

Cải thiện animations hiện có cho swipe/like/pass.

**Current State:**
- Đã có swipe animation với rotation
- Đã có `forceSwipe` function

**Enhancements:**
- **Scale animation khi nhấn buttons:**
  ```typescript
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  ```

- **Fade-in animation cho card tiếp theo:**
  ```typescript
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Khi currentIndex thay đổi
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);
  ```

- **Smooth exit animation:**
  - Thêm `opacity` vào card animation khi swipe
  - Card fade out trong khi swipe ra ngoài

### 4. Haptic Feedback

Sử dụng `react-native-haptic-feedback` library.

**Installation:**
```bash
npm install react-native-haptic-feedback
```

**Implementation:**
```typescript
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Like button
const handleLike = () => {
  ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
  forceSwipe("right");
};

// Pass button
const handleNope = () => {
  ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
  forceSwipe("left");
};

// Super Like (if implemented)
const handleSuperLike = () => {
  ReactNativeHapticFeedback.trigger("impactHeavy", hapticOptions);
  // Super like logic
};

// Swipe complete
const onSwipeComplete = (direction) => {
  ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
  // Existing logic...
};
```

**Haptic Types:**
- `impactLight` - Pass/Swipe complete
- `impactMedium` - Like
- `impactHeavy` - Super Like (future feature)

### 5. Status Badges

Component mới để hiển thị status của pet.

**Props Interface:**
```typescript
interface StatusBadgeProps {
  type: 'online' | 'new' | 'distance';
  value?: string; // For distance badge
  position: 'top-left' | 'top-right';
}
```

**Design:**
- **Online Badge:**
  - Background: `rgba(76, 175, 80, 0.9)` (green)
  - Icon: Green dot
  - Text: "Online"
  - Position: Top-right
  - Size: 60x24px
  - Border radius: 12px

- **New Badge:**
  - Background: `rgba(255, 152, 0, 0.9)` (orange)
  - Icon: Star or sparkle
  - Text: "New"
  - Position: Top-left
  - Size: 50x24px
  - Border radius: 12px

- **Distance Badge:**
  - Background: `rgba(0, 0, 0, 0.6)` (dark semi-transparent)
  - Icon: Location pin (already exists)
  - Text: Distance value
  - Position: Integrated into existing `distanceRow`
  - Enhanced styling với backdrop blur effect (nếu supported)

**Implementation:**
```typescript
const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, position }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'online':
        return {
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          icon: 'ellipse',
          text: 'Online',
        };
      case 'new':
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.9)',
          icon: 'star',
          text: 'New',
        };
      case 'distance':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          icon: 'location',
          text: value || '',
        };
    }
  };

  const style = getBadgeStyle();
  const positionStyle = position === 'top-left' 
    ? { top: 16, left: 16 } 
    : { top: 16, right: 16 };

  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }, positionStyle]}>
      <Icon name={style.icon} size={12} color="white" />
      <Text style={styles.badgeText}>{style.text}</Text>
    </View>
  );
};
```

**Integration vào PetCard:**
- Thêm `isOnline` và `isNew` vào `PetProfile` interface
- Render badges conditionally trong `renderCard`
- Badges nằm trên `imageContainer` với `position: absolute`

### 6. Enhanced Empty State

Cải thiện empty state hiện có khi hết pets.

**Current State:**
- Đã có empty state với icon, title, text, và reload button
- Sử dụng LinearGradient và Icon

**Enhancements:**
- **Fade-in animation:**
  ```typescript
  const emptyStateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (currentIndex >= pets.length) {
      Animated.timing(emptyStateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex, pets.length]);
  ```

- **Bounce animation cho icon:**
  ```typescript
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  ```

- **Additional CTA button:**
  - Thêm "Adjust Filters" button bên cạnh "Reload Pets"
  - Navigate đến FilterScreen

- **Improved messaging:**
  - Title: "No More Pets!" (giữ nguyên)
  - Text: "Check back later for more adorable matches" (giữ nguyên)
  - Thêm subtitle: "Or adjust your filters to see more pets"

## Data Models

### Extended PetProfile Interface

```typescript
interface PetProfile {
  id: string;
  name: string;
  age: string;
  breed: string;
  gender: "male" | "female";
  distance: string;
  bio: string;
  image: any;
  images: any[];
  personality: string[];
  owner: string;
  ownerId: number;
  matchPercent: number;
  ownerIsVip?: boolean;
  
  // New fields for status badges
  isOnline?: boolean;      // Pet owner is currently online
  isNew?: boolean;         // Pet was created within last 7 days
  createdAt?: string;      // ISO date string for calculating "new" status
  lastActiveAt?: string;   // ISO date string for calculating "online" status
}
```

### API Response Updates

Backend cần trả về thêm fields:
- `isOnline` hoặc `lastActiveAt` - Để xác định online status
- `createdAt` - Để xác định new status

Nếu backend chưa có, có thể mock data tạm thời:
```typescript
const formattedPets: PetProfile[] = petsToLoad.map((pet: RecommendedPet) => {
  // Existing mapping...
  
  // Mock data for status badges (remove when backend ready)
  const createdDate = new Date(pet.createdAt || Date.now());
  const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return {
    // ...existing fields,
    isOnline: Math.random() > 0.7, // 30% chance online (mock)
    isNew: daysSinceCreated <= 7,
    createdAt: pet.createdAt,
    lastActiveAt: pet.lastActiveAt,
  };
});
```

## Error Handling

### Skeleton Loading Errors

- Nếu API call fail, vẫn hiển thị skeleton trong 3 giây
- Sau đó hiển thị error message với retry button
- Error state:
  ```typescript
  const [error, setError] = useState<string | null>(null);
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={60} color={colors.error} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadPets}>
          <Text style={styles.retryButton}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  ```

### Pull-to-Refresh Errors

- Nếu refresh fail, hiển thị toast notification
- Không block UI, user có thể tiếp tục sử dụng
- Sử dụng `CustomAlert` component đã có

### Haptic Feedback Errors

- Wrap haptic calls trong try-catch
- Nếu fail (device không support), log warning nhưng không crash
- Graceful degradation

## Testing Strategy

### Unit Tests

1. **PetCardSkeleton Component:**
   - Render đúng số lượng skeleton cards
   - Shimmer animation chạy đúng
   - Kích thước match với pet card thật

2. **StatusBadge Component:**
   - Render đúng type (online/new/distance)
   - Position đúng (top-left/top-right)
   - Style đúng theo type

3. **Haptic Feedback:**
   - Trigger đúng haptic type cho mỗi action
   - Không crash khi device không support

### Integration Tests

1. **Loading Flow:**
   - Hiển thị skeleton khi loading = true
   - Thay skeleton bằng pet cards khi loading = false
   - Fade-in animation chạy mượt

2. **Pull-to-Refresh:**
   - Kéo xuống trigger refresh
   - Loading indicator hiển thị
   - Pets được reload sau khi refresh

3. **Swipe Animations:**
   - Card swipe mượt với rotation
   - Fade out khi swipe
   - Card tiếp theo fade in
   - Haptic feedback trigger đúng lúc

4. **Empty State:**
   - Hiển thị khi hết pets
   - Animation chạy đúng
   - Buttons navigate đúng

### Manual Testing Checklist

- [ ] Skeleton loading hiển thị khi mở app lần đầu
- [ ] Pull-to-refresh hoạt động không conflict với swipe
- [ ] Swipe animations mượt mà, không lag
- [ ] Haptic feedback cảm nhận được trên device thật
- [ ] Status badges hiển thị đúng vị trí, không che mất thông tin quan trọng
- [ ] Empty state đẹp và có animation
- [ ] Test trên cả iOS và Android
- [ ] Test trên nhiều kích thước màn hình
- [ ] Test với slow network (skeleton hiển thị lâu hơn)
- [ ] Test với no network (error handling)

## Performance Considerations

### Skeleton Loading

- Sử dụng `useNativeDriver: true` cho animations
- Limit số lượng skeleton cards (3-5 max)
- Không render quá nhiều elements trong skeleton

### Animations

- Tất cả animations sử dụng `useNativeDriver` khi có thể
- Avoid layout animations (expensive)
- Use `transform` và `opacity` (cheap)
- Memoize animation values với `useRef`

### Pull-to-Refresh

- Debounce refresh calls (không cho phép refresh liên tục)
- Cache pets data để hiển thị ngay khi quay lại screen

### Status Badges

- Chỉ render badges khi cần (conditional rendering)
- Không query online status cho tất cả pets, chỉ visible ones
- Cache online status trong một khoảng thời gian

## Implementation Phases

### Phase 1: Skeleton Loading (Priority 1)
- Tạo PetCardSkeleton component
- Integrate vào HomeScreen
- Replace spinner với skeleton
- Test và polish

### Phase 2: Pull-to-Refresh (Priority 2)
- Add RefreshControl
- Test với swipe gestures
- Handle errors

### Phase 3: Enhanced Animations (Priority 2)
- Add scale animation cho buttons
- Add fade-in cho cards
- Polish swipe animations

### Phase 4: Haptic Feedback (Priority 3)
- Install library
- Add haptic calls
- Test trên devices

### Phase 5: Status Badges (Priority 3)
- Tạo StatusBadge component
- Update PetProfile interface
- Integrate vào cards
- Mock data nếu backend chưa ready

### Phase 6: Enhanced Empty State (Priority 4)
- Add animations
- Add additional CTA
- Polish messaging

## Dependencies

### New Libraries to Install

```json
{
  "react-native-haptic-feedback": "^2.2.0"
}
```

### Existing Libraries Used

- `react-native-linear-gradient` - Đã có
- `react-native-vector-icons` - Đã có
- `@react-native-async-storage/async-storage` - Đã có
- React Native Animated API - Built-in

## Accessibility

- Skeleton loading: Add `accessibilityLabel="Loading pets"`
- Status badges: Add descriptive labels
- Haptic feedback: Không ảnh hưởng accessibility
- Empty state: Ensure text có contrast tốt
- All touchable elements: Add `accessibilityRole` và `accessibilityLabel`

## Backward Compatibility

- Tất cả changes đều backward compatible
- Không breaking changes cho existing code
- New fields trong PetProfile là optional
- Haptic feedback gracefully degrade nếu không support
