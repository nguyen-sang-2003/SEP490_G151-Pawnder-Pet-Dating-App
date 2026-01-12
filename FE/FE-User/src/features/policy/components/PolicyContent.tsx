import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface PolicyContentProps {
  content: string;
  maxHeight?: number;
  scrollable?: boolean;
}

/**
 * PolicyContent component
 * Renders policy content with basic HTML tag stripping and text formatting
 * For full HTML support, consider adding react-native-render-html package
 */
const PolicyContent: React.FC<PolicyContentProps> = ({
  content,
  maxHeight,
  scrollable = true,
}) => {
  // Process content - strip HTML tags and format text
  const processedContent = useMemo(() => {
    // Check if content contains HTML
    const hasHtml = /<[a-z][\s\S]*>/i.test(content);
    
    if (!hasHtml) {
      return content;
    }

    // Basic HTML processing
    let processed = content
      // Replace common block elements with newlines
      .replace(/<\/?(p|div|br|h[1-6]|li|ul|ol)[^>]*>/gi, '\n')
      // Replace list items with bullet points
      .replace(/<li[^>]*>/gi, '\n• ')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();

    return processed;
  }, [content]);

  const renderContent = () => (
    <Text style={styles.contentText}>
      {processedContent}
    </Text>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollContainer, maxHeight ? { maxHeight } : null]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.contentWrapper}>
          {renderContent()}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentWrapper: {
    paddingTop: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSize.md,
    color: colors.textDark,
    lineHeight: 22,
  },
});

export default PolicyContent;
