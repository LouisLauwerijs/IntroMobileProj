import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  uri?: string;
  size?: number;
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, size = 42, style }) => {
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
  }

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name="person" size={size * 0.6} color="#ccc" />
    </View>
  );
};