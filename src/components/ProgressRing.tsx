import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
}

export default function ProgressRing({ progress, size, strokeWidth, color }: ProgressRingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const segments = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring segments */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = center + radius * Math.cos(rad) - strokeWidth / 2;
        const y = center + radius * Math.sin(rad) - strokeWidth / 2;
        const filled = i < (clampedProgress / 100) * segments;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              {
                width: strokeWidth,
                height: strokeWidth,
                borderRadius: strokeWidth / 2,
                backgroundColor: filled ? color : '#E8E8E8',
                left: x,
                top: y,
              },
            ]}
          />
        );
      })}
      <View style={styles.centerText}>
        <Text style={[styles.percentage, { color }]}>{Math.round(clampedProgress)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  segment: { position: 'absolute' },
  centerText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: { fontSize: 10, fontWeight: '700' },
});
