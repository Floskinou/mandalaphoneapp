import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  progress: number; // 0..1 within the cycle
  dayNumber: number;
  phaseLabel: string;
  phaseEmoji: string;
};

export default function CycleRing({ size = 220, progress, dayNumber, phaseLabel, phaseEmoji }: Props) {
  const c = size / 2;
  const rOuter = size / 2 - 10;
  const rInner = rOuter - 26;

  const arc = (r: number) => `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r}`;

  const phases = [
    { key: 'menstrual', color: '#E86A8A' },
    { key: 'follicular', color: '#F2A3C0' },
    { key: 'ovulatory', color: '#C2559B' },
    { key: 'luteal', color: '#9B72CF' },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={(rOuter + rInner) / 2} fill="none" stroke={colors.rosewater} strokeWidth={rOuter - rInner} />
        {phases.map((p, i) => (
          <G key={p.key} rotation={i * 90 - 90} originX={c} originY={c}>
            <Path d={arc((rOuter + rInner) / 2)} fill="none" stroke={p.color} strokeWidth={rOuter - rInner} strokeDasharray={`${(Math.PI * (rOuter + rInner)) / 2 - 6} 9999`} strokeLinecap="round" opacity={0.85} />
          </G>
        ))}
        <Path
          d={arc(rOuter)}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={8}
          strokeDasharray={`${progress * 2 * Math.PI * rOuter} 99999`}
          strokeLinecap="round"
        />
        <G>
          <SvgText x={c} y={c - 16} textAnchor="middle" fill={colors.muted} fontSize={12} fontWeight="600">
            {phaseEmoji} Jour
          </SvgText>
          <SvgText x={c} y={c + 22} textAnchor="middle" fill={colors.green} fontSize={40} fontWeight="900">
            {dayNumber}
          </SvgText>
        </G>
      </Svg>
      <View style={styles.phaseChip}>
        <Text style={styles.phaseText}>{phaseLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phaseChip: {
    marginTop: -18,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    shadowColor: colors.green,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  phaseText: { color: colors.violet, fontWeight: '800', fontSize: 13 },
});
