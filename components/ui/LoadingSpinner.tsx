import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({ 
  size = 'large', 
  color = '#253882', // Default color instead of theme
  style 
}: LoadingSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
      style={style}
    />
  );
}