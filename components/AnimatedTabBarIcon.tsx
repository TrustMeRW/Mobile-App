import React from 'react';
import { MotiView } from 'moti';
import { SvgProps } from 'react-native-svg';

// lucide-react-native IconProps
interface IconProps extends SvgProps {
  size?: number | string;
  color?: string;
}

interface AnimatedTabBarIconProps {
  isFocused: boolean;
  color: string;
  icon: React.FC<IconProps>;
  size: number;
}

export const AnimatedTabBarIcon: React.FC<AnimatedTabBarIconProps> = ({
  isFocused,
  color,
  icon: Icon,
  size,
}) => {
  return (
    <MotiView
      from={{
        scale: 1,
        translateY: 0,
      }}
      animate={{
        scale: isFocused ? 1.2 : 1,
        translateY: isFocused ? -8 : 0,
      }}
      transition={{
        type: 'timing',
        duration: 200,
      }}
    >
      <Icon color={color} size={size} />
    </MotiView>
  );
};
