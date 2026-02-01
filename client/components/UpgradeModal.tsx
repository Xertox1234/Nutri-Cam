import React, { useCallback, useRef, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibility } from "@/hooks/useAccessibility";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { SUBSCRIPTION_PRODUCT } from "@shared/types/premium";
import type { PurchaseState } from "@shared/types/subscription";
import {
  isPurchaseInProgress,
  canInitiatePurchase,
} from "@/lib/subscription/type-guards";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onRestore: () => void;
  purchaseState: PurchaseState;
}

const BENEFITS = [
  { icon: "infinite-outline" as const, text: "Unlimited daily scans" },
  { icon: "videocam-outline" as const, text: "Video recording (coming soon)" },
  { icon: "star-outline" as const, text: "Priority support" },
];

const AnimatedView = Animated.createAnimatedComponent(View);

export function UpgradeModal({
  visible,
  onClose,
  onPurchase,
  onRestore,
  purchaseState,
}: UpgradeModalProps) {
  const { theme, isDark } = useTheme();
  const { reducedMotion } = useAccessibility();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  // Ref to prevent double-tap
  const isPurchasingRef = useRef(false);

  const isLoading = isPurchaseInProgress(purchaseState);
  const canPurchase = canInitiatePurchase(purchaseState) && !isLoading;

  // Animate in/out
  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withSpring(0);
      translateY.value = withSpring(100);
    }
  }, [visible, opacity, translateY]);

  // Reset purchasing ref when state changes to idle
  useEffect(() => {
    if (purchaseState.status === "idle") {
      isPurchasingRef.current = false;
    }
  }, [purchaseState.status]);

  const handlePurchase = useCallback(() => {
    // Guard against double-tap
    if (isPurchasingRef.current || !canPurchase) return;
    isPurchasingRef.current = true;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPurchase();
  }, [canPurchase, onPurchase]);

  const handleRestore = useCallback(() => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRestore();
  }, [isLoading, onRestore]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  const backgroundStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: visible ? 1 : 0 };
    }
    return { opacity: opacity.value };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { transform: [{ translateY: visible ? 0 : 100 }] };
    }
    return { transform: [{ translateY: translateY.value }] };
  });

  const errorMessage =
    purchaseState.status === "error" ? purchaseState.error.message : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <AnimatedView style={[styles.overlay, backgroundStyle]}>
        <Pressable
          style={styles.overlayPressable}
          onPress={handleClose}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Close upgrade modal"
        />
      </AnimatedView>

      <AnimatedView
        style={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.lg },
          contentStyle,
        ]}
      >
        <ThemedView
          style={styles.content}
          accessible
          accessibilityLabel="Upgrade to Premium dialog"
        >
          {/* Close button */}
          <Pressable
            onPress={handleClose}
            disabled={isLoading}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="h2" style={styles.title}>
              Go Premium
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Unlock unlimited scans and premium features
            </ThemedText>
          </View>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: theme.success + "20" },
                  ]}
                >
                  <Ionicons
                    name={benefit.icon}
                    size={20}
                    color={theme.success}
                  />
                </View>
                <ThemedText type="body" style={styles.benefitText}>
                  {benefit.text}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricing}>
            <ThemedText type="h3" style={styles.price}>
              {SUBSCRIPTION_PRODUCT.priceDisplay}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.priceSubtext, { color: theme.textSecondary }]}
            >
              {SUBSCRIPTION_PRODUCT.monthlyEquivalent} •{" "}
              {SUBSCRIPTION_PRODUCT.trialDays}-day free trial
            </ThemedText>
          </View>

          {/* Error message */}
          {errorMessage && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.error + "15" },
              ]}
            >
              <ThemedText
                type="small"
                style={[styles.errorText, { color: theme.error }]}
              >
                {errorMessage}
              </ThemedText>
            </View>
          )}

          {/* CTA Button */}
          <Button
            onPress={handlePurchase}
            disabled={!canPurchase}
            style={styles.ctaButton}
            accessibilityLabel={`Start ${SUBSCRIPTION_PRODUCT.trialDays}-day free trial`}
            accessibilityHint="Starts your premium subscription with a free trial period"
          >
            {isLoading ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
                testID="purchase-loading"
              />
            ) : (
              `Start ${SUBSCRIPTION_PRODUCT.trialDays}-Day Free Trial`
            )}
          </Button>

          {/* Restore purchases */}
          <Pressable
            onPress={handleRestore}
            disabled={isLoading}
            style={styles.restoreButton}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <ThemedText
              type="link"
              style={[
                styles.restoreText,
                { color: theme.link, opacity: isLoading ? 0.5 : 1 },
              ]}
            >
              Restore Purchases
            </ThemedText>
          </Pressable>

          {/* Legal text */}
          <ThemedText
            type="caption"
            style={[styles.legalText, { color: theme.textSecondary }]}
          >
            Subscription automatically renews. Cancel anytime in App Store
            settings.
          </ThemedText>
        </ThemedView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayPressable: {
    flex: 1,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.xs,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  benefitsList: {
    marginBottom: Spacing.xl,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  pricing: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  price: {
    marginBottom: Spacing.xs,
  },
  priceSubtext: {
    textAlign: "center",
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    textAlign: "center",
  },
  ctaButton: {
    marginBottom: Spacing.lg,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  restoreText: {
    fontWeight: "500",
  },
  legalText: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
});
