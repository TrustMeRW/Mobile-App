import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {}

export const Card: React.FC<CardProps> = ({ style, ...props }) => {
  const { colors } = useTheme();

  const cardStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
  };

  return <View style={[styles.card, cardStyle, style]} {...props} />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
});