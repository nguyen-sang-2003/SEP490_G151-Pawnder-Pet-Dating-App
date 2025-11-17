# Implementation Plan - HomeScreen Improvements

- [x] 1. Implement Skeleton Loading for Pet Cards





  - Create PetCardSkeleton component with shimmer animation
  - Replace ActivityIndicator with skeleton cards in HomeScreen loading state
  - Add fade-in transition when pets load
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Create PetCardSkeleton component


  - Create new file `FE/FE-User/src/components/PetCardSkeleton.tsx`
  - Implement skeleton layout matching pet card dimensions (CARD_WIDTH x CARD_HEIGHT)
  - Add image placeholder section (70% height) and info section (30% height)
  - Style with light gray background and border radius matching pet cards
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Implement shimmer animation

  - Use Animated.Value for shimmer effect
  - Create gradient overlay that moves from left to right
  - Set animation duration to 1.5 seconds with infinite loop
  - Use useNativeDriver for performance
  - _Requirements: 1.4_

- [x] 1.3 Integrate skeleton into HomeScreen


  - Import PetCardSkeleton component
  - Replace ActivityIndicator in loading state with PetCardSkeleton
  - Render 3-5 skeleton cards stacked like real pet cards
  - Position skeletons in cardsContainer with proper zIndex
  - _Requirements: 1.1, 1.2_

- [x] 1.4 Add fade-in transition for loaded pets


  - Create fadeAnim using useRef and Animated.Value
  - Trigger fade-in animation when loading changes from true to false
  - Apply opacity animation to first visible pet card
  - Set duration to 300ms for smooth transition
  - _Requirements: 1.2_

- [x] 2. Implement Pull-to-Refresh functionality




  - Wrap cards container in ScrollView with RefreshControl
  - Add refreshing state and onRefresh handler
  - Test compatibility with existing swipe gestures
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Add RefreshControl to HomeScreen


  - Import RefreshControl from react-native
  - Add refreshing state (boolean) to HomeScreen
  - Wrap cardsContainer in ScrollView with RefreshControl prop
  - Configure RefreshControl colors to match app theme
  - _Requirements: 2.1, 2.3_

- [x] 2.2 Implement refresh handler


  - Create onRefresh function that sets refreshing to true
  - Call loadPets() to reload pet data from API
  - Set refreshing to false when loadPets completes
  - Add error handling for failed refresh attempts
  - _Requirements: 2.2, 2.4_

- [x] 2.3 Test gesture compatibility


  - Verify pull-to-refresh doesn't interfere with horizontal swipe gestures
  - Adjust PanResponder if needed to distinguish vertical vs horizontal gestures
  - Test on both iOS and Android devices
  - _Requirements: 2.1, 2.2_

- [x] 3. Enhance card swipe animations





  - Add scale animation to Like/Pass buttons
  - Implement fade-out effect during swipe
  - Add fade-in animation for next card
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 3.1 Add button press scale animation

  - Create scaleAnim using useRef and Animated.Value for each button
  - Implement scale down (0.9) then scale up (1.0) sequence on button press
  - Apply transform scale to button styles
  - Set duration to 100ms for each phase (200ms total)
  - _Requirements: 3.3, 3.5_

- [x] 3.2 Add fade-out during swipe


  - Add opacity interpolation to position.x in existing swipe animation
  - Card opacity decreases as it moves away from center
  - Ensure smooth transition using useNativeDriver
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 3.3 Implement next card fade-in


  - Create fadeAnim for incoming card using useRef and Animated.Value
  - Trigger fade-in when currentIndex changes
  - Start from opacity 0 to 1 over 300ms
  - Apply to card at currentIndex + 1
  - _Requirements: 3.4, 3.5_

- [x] 4. Add haptic feedback for interactions




  - Install react-native-haptic-feedback library
  - Add haptic triggers to Like button (medium impact)
  - Add haptic triggers to Pass button (light impact)
  - Add haptic triggers to swipe complete (light impact)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.1 Install haptic feedback library


  - Run `npm install react-native-haptic-feedback`
  - Link native dependencies if needed (for older React Native versions)
  - Import ReactNativeHapticFeedback in HomeScreen
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [x] 4.2 Add haptic to Like button

  - Call ReactNativeHapticFeedback.trigger("impactMedium") in handleLike
  - Add haptic options with enableVibrateFallback
  - Wrap in try-catch for graceful degradation
  - _Requirements: 4.1_

- [x] 4.3 Add haptic to Pass button


  - Call ReactNativeHapticFeedback.trigger("impactLight") in handleNope
  - Use same haptic options as Like button
  - Wrap in try-catch for graceful degradation
  - _Requirements: 4.2_

- [x] 4.4 Add haptic to swipe complete


  - Call ReactNativeHapticFeedback.trigger("impactLight") in onSwipeComplete
  - Trigger after direction is determined
  - Wrap in try-catch for graceful degradation
  - _Requirements: 4.4_

- [x] 5. Implement status badges for pet cards



  - Create StatusBadge component
  - Add isOnline and isNew fields to PetProfile interface
  - Integrate badges into pet card rendering
  - Mock badge data if backend not ready
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5.1 Create StatusBadge component


  - Create new file `FE/FE-User/src/components/StatusBadge.tsx`
  - Define StatusBadgeProps interface (type, value, position)
  - Implement badge rendering with icon and text
  - Style badges with semi-transparent backgrounds and border radius
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 5.2 Update PetProfile interface


  - Add isOnline optional boolean field
  - Add isNew optional boolean field
  - Add createdAt optional string field
  - Add lastActiveAt optional string field
  - Update interface in HomeScreen.tsx
  - _Requirements: 5.1, 5.2_

- [x] 5.3 Integrate badges into pet cards


  - Import StatusBadge component in HomeScreen
  - Add conditional rendering for Online badge (top-right) when isOnline is true
  - Add conditional rendering for New badge (top-left) when isNew is true
  - Position badges absolutely over imageContainer
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 5.4 Add mock badge data


  - Calculate isNew based on createdAt (within 7 days)
  - Mock isOnline with random value (30% chance) if backend not ready
  - Update formattedPets mapping in loadPets function
  - Add TODO comment to replace with real backend data
  - _Requirements: 5.1, 5.2_

- [x] 6. Enhance empty state with animations



  - Add fade-in animation to empty state container
  - Add bounce animation to paw icon
  - Add "Adjust Filters" button alongside "Reload Pets"
  - Improve messaging with subtitle
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6.1 Add fade-in animation to empty state





  - Create emptyStateAnim using useRef and Animated.Value
  - Trigger animation when currentIndex >= pets.length
  - Fade from opacity 0 to 1 over 500ms
  - Apply to noMoreCards container
  - _Requirements: 6.4_

- [x] 6.2 Add bounce animation to icon


  - Create bounceAnim using useRef and Animated.Value
  - Implement loop animation with translateY from 0 to -10 and back
  - Set duration to 1000ms per direction (2000ms total loop)
  - Apply transform to noMoreIconGradient
  - _Requirements: 6.4_

- [x] 6.3 Add "Adjust Filters" button

  - Create new TouchableOpacity button below "Reload Pets"
  - Style with secondary button appearance (outline or ghost style)
  - Navigate to FilterScreen on press
  - Add icon (options or filter icon)
  - _Requirements: 6.3_

- [x] 6.4 Improve empty state messaging

  - Keep existing title "No More Pets!"
  - Keep existing text "Check back later for more adorable matches"
  - Add subtitle "Or adjust your filters to see more pets"
  - Style subtitle with smaller font and lighter color
  - _Requirements: 6.1, 6.2_
