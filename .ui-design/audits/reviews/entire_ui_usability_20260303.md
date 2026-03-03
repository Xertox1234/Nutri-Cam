# Design Review: Entire UI — Usability Focus

**Review ID:** entire_ui_usability_20260303
**Reviewed:** 2026-03-03
**Target:** `client/` (entire UI directory — 35 screens, 40+ components)
**Focus:** Usability (interaction patterns, accessibility)
**Platform:** Mobile (iOS primary)

## Summary

The app has a strong usability foundation: consistent haptic feedback across 41 files, well-implemented skeleton loaders, proper safe area handling, and a solid accessibility baseline with 541 a11y attribute usages across 77 files. However, there are critical gaps in touch target sizing on several screens, missing live region announcements for dynamic content, inconsistent error feedback patterns, and color contrast failures on accent colors. These issues primarily affect users relying on assistive technology and users with motor impairments.

**Issues Found:** 18

- Critical: 3
- Major: 7
- Minor: 5
- Suggestions: 3

---

## Critical Issues

### Issue 1: Touch targets critically undersized on multiple screens

**Severity:** Critical
**Category:** Usability / Accessibility
**Locations:**

- `client/screens/WeightTrackingScreen.tsx` ~line 256 — "Set goal weight" pencil icon: ~18pt target, no hitSlop
- `client/screens/FastingScreen.tsx` ~line 401 — Edit schedule pencil icon: ~16pt target, no hitSlop
- `client/components/SavedItemCard.tsx` ~lines 143, 157 — Share/delete icon buttons: ~26-28pt effective target
- `client/screens/GLP1CompanionScreen.tsx` ~lines 427-432 — Brand selector chips: ~21pt height

**Problem:**
Apple's Human Interface Guidelines require 44x44pt minimum touch targets. Several icon-only buttons and selector chips have effective tap areas well below this threshold, making them difficult or impossible to tap accurately for users with motor impairments.

**Impact:**
Users with motor difficulties, older users, and anyone using the app one-handed will struggle to hit these targets. This also fails WCAG 2.5.8 (Target Size minimum).

**Recommendation:**
Add `hitSlop` padding or wrap in a larger `Pressable` with explicit `minHeight: 44, minWidth: 44`:

```tsx
// Before (WeightTrackingScreen.tsx)
<Pressable onPress={openGoalEditor}>
  <Feather name="edit-2" size={18} color={theme.textSecondary} />
</Pressable>

// After
<Pressable
  onPress={openGoalEditor}
  hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }}
  accessibilityLabel="Edit goal weight"
  accessibilityRole="button"
>
  <Feather name="edit-2" size={18} color={theme.textSecondary} />
</Pressable>
```

For chips/selectors, enforce `minHeight: 44` in the style:

```tsx
// GLP1CompanionScreen brand chips
brandChip: {
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  minHeight: 44, // Add this
  justifyContent: "center",
}
```

---

### Issue 2: No screen reader announcements for dynamic content updates

**Severity:** Critical
**Category:** Accessibility
**Locations:**

- `client/screens/ChatScreen.tsx` — AI responses arrive with no announcement
- `client/screens/LoginScreen.tsx` ~lines 160-175 — Error banner has no `accessibilityLiveRegion`
- `client/screens/ScanScreen.tsx` ~lines 396-401 — Scan status text changes silently
- `client/screens/QuickLogScreen.tsx` — Parse results appear with no announcement
- `client/screens/WeightTrackingScreen.tsx` — No success announcement after logging
- `client/screens/ExerciseLogScreen.tsx` — No success announcement after logging

**Problem:**
When content changes dynamically (errors appear, AI responses stream in, mutations succeed), VoiceOver/TalkBack users receive no notification. They have no way to know that content has updated without manually exploring the screen.

**Impact:**
The app is essentially unusable for screen reader users in key flows: chat, scanning, and form submission feedback.

**Recommendation:**
Add `accessibilityLiveRegion="assertive"` for errors and `"polite"` for content updates:

```tsx
// LoginScreen error banner
<View
  style={styles.errorContainer}
  accessibilityLiveRegion="assertive"
  accessibilityRole="alert"
>

// ChatScreen — announce when streaming completes
useEffect(() => {
  if (!isStreaming && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant") {
      AccessibilityInfo.announceForAccessibility("Response received");
    }
  }
}, [isStreaming]);

// Mutation success feedback
onSuccess: () => {
  haptics.notification(NotificationFeedbackType.Success);
  AccessibilityInfo.announceForAccessibility("Weight logged successfully");
}
```

---

### Issue 3: Color contrast failures on accent colors in light mode

**Severity:** Critical
**Category:** Usability / Accessibility
**Locations:**

- `client/constants/theme.ts` — `success/proteinAccent: "#00C853"` (~2.7:1 on white)
- `client/constants/theme.ts` — `calorieAccent/carbsAccent: "#FF6B35"` (~3.1:1 on `#F2F2F2`)
- `client/constants/theme.ts` — `textSecondary: "#878787"` (~4.1:1 on white, marginal)
- `client/screens/HistoryScreen.tsx` ~lines 253-273 — Macro labels use these accent colors
- `client/screens/WeightTrackingScreen.tsx` ~line 199 — Trend value in success green

**Problem:**
WCAG AA requires 4.5:1 contrast for normal text. The green (`#00C853`) and orange (`#FF6B35`) accent colors used for macro labels, success indicators, and progress values fail this requirement on light backgrounds.

**Impact:**
Users with low vision or color vision deficiency will have difficulty reading calorie/macro values, weight trends, and success indicators. These are core data display elements in a nutrition app.

**Recommendation:**
Darken the accent colors to pass AA:

```ts
// theme.ts light mode — adjusted for 4.5:1+ contrast on white
success: "#00873A",        // was #00C853 (2.7:1 → 4.6:1)
proteinAccent: "#00873A",  // was #00C853
carbsAccent: "#D4541A",    // was #FF6B35 (3.1:1 → 4.6:1)
fatAccent: "#B8960A",      // was #FFC107 — verify contrast
textSecondary: "#6B6B6B",  // was #878787 (4.1:1 → 5.7:1)
```

---

## Major Issues

### Issue 4: Missing `accessibilityState` on disabled/loading buttons

**Severity:** Major
**Category:** Accessibility
**Locations:**

- `client/screens/FastingScreen.tsx` — End/Start Fast buttons
- `client/screens/WeightTrackingScreen.tsx` ~line 139 — Log weight button
- `client/screens/ExerciseLogScreen.tsx` ~line 279 — Log exercise button
- `client/screens/QuickLogScreen.tsx` ~line 191 — Parse food button
- `client/screens/GLP1CompanionScreen.tsx` ~lines 345-444 — Medication/brand selectors

**Problem:**
These `Pressable` elements set `disabled` natively but don't provide `accessibilityState={{ disabled, busy }}`. Screen readers announce the button but don't tell users it's disabled or loading.

**Impact:**
VoiceOver users will try to activate disabled buttons and receive no feedback about why nothing happens.

**Recommendation:**
Add `accessibilityState` matching the native `disabled` prop:

```tsx
<Pressable
  disabled={isPending || !input}
  accessibilityState={{ disabled: isPending || !input, busy: isPending }}
>
```

---

### Issue 5: Inconsistent error display patterns across forms

**Severity:** Major
**Category:** Usability
**Locations:**

- `client/screens/LoginScreen.tsx` — Inline error banner (good pattern)
- `client/screens/WeightTrackingScreen.tsx` — `Alert.alert()` for validation
- `client/screens/ExerciseLogScreen.tsx` — `Alert.alert()` for validation
- `client/screens/ChatScreen.tsx` — `Alert.alert()` for errors

**Problem:**
Some screens show inline error banners (LoginScreen) while others use native `Alert.alert()` dialogs. The alert dialogs are disruptive, don't persist for review, and are difficult for screen readers to handle. There's also no shared error component.

**Impact:**
Inconsistent error patterns increase cognitive load — users can't predict where error feedback will appear. Alert dialogs interrupt flow and disappear after dismissal.

**Recommendation:**
Extract the LoginScreen error banner into a shared `InlineError` component and use it everywhere:

```tsx
// components/InlineError.tsx
export function InlineError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: withOpacity(theme.error, 0.06) },
      ]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <Feather name="alert-circle" size={16} color={theme.error} />
      <ThemedText type="small" style={{ color: theme.error }}>
        {message}
      </ThemedText>
    </View>
  );
}
```

---

### Issue 6: Modal focus trapping missing on most modals

**Severity:** Major
**Category:** Accessibility
**Locations:**

- `client/screens/GLP1CompanionScreen.tsx` ~line 291
- `client/components/RecipeGenerationModal.tsx`
- `client/components/UpgradeModal.tsx`
- `client/components/GroceryListPickerModal.tsx`
- `client/components/MealSuggestionsModal.tsx`
- `client/components/FastingSetupModal.tsx`

**Problem:**
These modals don't set `accessibilityViewIsModal={true}` on their content container. Without this, VoiceOver allows focus to escape behind the modal, letting users interact with obscured content.

**Impact:**
Screen reader users can accidentally interact with elements behind the modal, leading to confusion and unintended actions.

**Recommendation:**
Add `accessibilityViewIsModal` to each modal's inner content `View`:

```tsx
<Modal visible={visible} presentationStyle="pageSheet">
  <View style={styles.container} accessibilityViewIsModal>
    {/* modal content */}
  </View>
</Modal>
```

---

### Issue 7: No keyboard dismiss on scroll

**Severity:** Major
**Category:** Usability
**Locations:** All screens with text inputs + scrollable content

**Problem:**
No screen sets `keyboardDismissMode="on-drag"` on `ScrollView` or `FlatList`. Users must tap outside an input to dismiss the keyboard — scrolling doesn't dismiss it.

**Impact:**
On form-heavy screens (QuickLog, RecipeCreate, GoalSetup, Login), the keyboard obscures content and users have no intuitive way to dismiss it while scrolling.

**Recommendation:**
Add `keyboardDismissMode="on-drag"` to all primary `ScrollView` and `FlatList` components:

```tsx
<ScrollView keyboardDismissMode="on-drag" ...>
```

---

### Issue 8: Long-press delete is undiscoverable

**Severity:** Major
**Category:** Usability
**Locations:**

- `client/screens/WeightTrackingScreen.tsx` ~line 327
- `client/screens/ExerciseLogScreen.tsx` ~line 336
- `client/screens/ChatListScreen.tsx` ~line 126

**Problem:**
Item deletion requires long-press, which is a hidden gesture with no visual affordance. While `accessibilityHint="Long press to delete"` helps screen reader users, sighted users have no indication that long-press is available.

**Impact:**
Users who want to delete items may not discover the gesture. This is especially problematic for new users and users unfamiliar with long-press patterns.

**Recommendation:**
Consider adding a subtle visual hint, such as a small delete icon on the trailing edge of list items, or showing a contextual tooltip on first use. Alternatively, implement swipe-to-reveal actions (common iOS pattern) as an additional gesture.

---

### Issue 9: `KeyboardAvoidingView` has no Android behavior

**Severity:** Major
**Category:** Usability
**Locations:**

- `client/screens/ChatScreen.tsx` ~line 248
- `client/screens/WeightTrackingScreen.tsx` ~line 107
- `client/screens/ExerciseLogScreen.tsx` ~line 152
- Multiple modals

**Problem:**
All `KeyboardAvoidingView` instances use `behavior={Platform.OS === "ios" ? "padding" : undefined}`. Setting behavior to `undefined` on Android means the component does nothing — the keyboard will overlap form inputs on Android.

**Impact:**
Android users may not be able to see or interact with inputs when the keyboard is open.

**Recommendation:**

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
>
```

---

### Issue 10: Wrong accessibility roles on selection groups

**Severity:** Major
**Category:** Accessibility
**Locations:**

- `client/components/AppetiteTracker.tsx` ~line 40 — `"button"` instead of `"radio"`
- `client/screens/GLP1CompanionScreen.tsx` ~lines 345-393 — `"button"` instead of `"radio"` for medication selection
- `client/screens/MenuScanResultScreen.tsx` ~line 53 — `"summary"` is not a valid RN accessibility role

**Problem:**
Single-select groups use `accessibilityRole="button"` when they should use `"radio"`. VoiceOver announces these as buttons, not as selection options, hiding the single-select constraint.

**Impact:**
Screen reader users don't understand the selection model — they can't tell that selecting one option deselects another.

**Recommendation:**

```tsx
// AppetiteTracker.tsx
<Pressable
  accessibilityRole="radio"
  accessibilityState={{ selected: selected === level.value }}
  accessibilityLabel={`Appetite level ${level.label}`}
>
```

---

## Minor Issues

### Issue 11: Inconsistent pull-to-refresh tint colors

**Severity:** Minor
**Locations:** HomeScreen (`theme.success`), SavedItemsScreen (`theme.link`), PantryScreen (system default)

**Problem:** RefreshControl tint color varies across screens with no pattern.

**Recommendation:** Standardize on `theme.primary` or `theme.success` across all screens.

---

### Issue 12: No success feedback after mutations

**Severity:** Minor
**Locations:** WeightTrackingScreen, ExerciseLogScreen, QuickLogScreen, GLP1CompanionScreen

**Problem:** After successfully logging data, the only feedback is a haptic vibration and the form clearing. There's no visual confirmation (toast/snackbar) that the action succeeded.

**Recommendation:** Create a shared lightweight toast component for success confirmation, similar to the one-off snackbar in GroceryListScreen.

---

### Issue 13: Images missing accessibility labels

**Severity:** Minor
**Locations:**

- `client/screens/HomeScreen.tsx` ~line 197 — User avatar
- `client/screens/ItemDetailScreen.tsx` — Product image
- `client/screens/FeaturedRecipeDetailScreen.tsx` — Hero recipe image
- `client/screens/meal-plan/RecipeBrowserScreen.tsx` — Recipe thumbnails

**Problem:** `<Image>` components have no `accessibilityLabel`. Screen readers either skip them or announce unhelpful file paths.

**Recommendation:** Add descriptive labels: `accessibilityLabel={`Photo of ${recipe.title}`}` or mark as decorative with `accessible={false}`.

---

### Issue 14: GLP1CompanionScreen section headings use raw `<Text>`

**Severity:** Minor
**Location:** `client/screens/GLP1CompanionScreen.tsx` ~lines 210-248

**Problem:** Section titles ("Common Side Effects", "Dose History") use `<Text>` with manual Typography styles instead of `<ThemedText type="h4">`, so they don't get automatic `accessibilityRole="header"`.

**Recommendation:** Replace with `<ThemedText type="h4">` for proper heading semantics.

---

### Issue 15: HomeScreen "Recipes For You" not marked as heading

**Severity:** Minor
**Location:** `client/screens/HomeScreen.tsx` ~line 293

**Problem:** Section title uses `<ThemedText type="body">` instead of a heading type, so VoiceOver doesn't announce it as a section header and users can't navigate by headings.

**Recommendation:** Change to `<ThemedText type="h4">`.

---

## Suggestions

### Suggestion 1: Add swipe-to-reveal actions on list items

Currently all list item actions (delete, save, share) require long-press or navigating to detail. Swipe-to-reveal is the standard iOS pattern for contextual actions and would improve discoverability and efficiency.

---

### Suggestion 2: Extract a shared Toast/Snackbar component

GroceryListScreen has a one-off snackbar implementation. Extracting this into a shared component (or using a library like `react-native-toast-message`) would enable consistent success/undo feedback across all mutation flows.

---

### Suggestion 3: Add `keyboardDismissMode="interactive"` on chat

ChatScreen would benefit from `keyboardDismissMode="interactive"` (drag-to-dismiss with the keyboard tracking the finger) for a more polished messaging experience, matching the behavior of iOS Messages.

---

## Positive Observations

- **Haptic feedback is exemplary** — 41 files use the `useHaptics()` hook with proper feedback types (light/medium/selection/notification) and all respect `reducedMotion`
- **Skeleton loaders are well-implemented** — shimmer animations disable when reduced motion is on, and all skeletons are hidden from screen readers with `accessibilityElementsHidden`
- **Core components have strong a11y defaults** — `Button` auto-derives labels and sets `busy` state, `ThemedText` auto-applies heading roles, `ProgressBar` has full `accessibilityValue`, `Chip` handles `selected` state
- **Safe area handling is thorough** — every screen accounts for notch/dynamic island and tab bar clearance
- **Destructive action confirmations are consistent** — all delete actions use the standard `Alert.alert()` two-button pattern with `style: "destructive"`
- **Recipe builder focus management is excellent** — `RecipeCreateScreen` implements proper focus return with `AccessibilityInfo.setAccessibilityFocus()` and `accessibilityViewIsModal` on sheets
- **Empty states follow a consistent pattern** — icon + title + description, centered, with actionable CTAs where appropriate

## Next Steps

1. **Fix critical touch targets** — Add hitSlop/minHeight to the 4 identified undersized targets (quick win, high impact)
2. **Add `accessibilityLiveRegion` to error banners and dynamic content** — LoginScreen error, ChatScreen responses, scan status
3. **Darken accent colors for AA contrast** — Adjust `success`, `proteinAccent`, `carbsAccent` in theme.ts
4. **Add `accessibilityViewIsModal`** to all 6 modals missing it
5. **Add `accessibilityState`** to all disabled/loading buttons
6. **Standardize error display** — Extract shared InlineError component
7. **Add `keyboardDismissMode="on-drag"`** to scrollable form screens

---

_Generated by UI Design Review. Run `/ui-design:design-review` again after fixes._
