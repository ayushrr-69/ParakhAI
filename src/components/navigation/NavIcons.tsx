import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { theme } from '@/theme';

type IconProps = {
  active: boolean;
};

const stroke = (active: boolean) => (active ? theme.colors.textDark : theme.colors.surface);

export function HomeIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 22 22' fill='none'>
      <Path d='M3 9.5L11 3l8 6.5v9a1 1 0 0 1-1 1h-4.8v-6H8.8v6H4a1 1 0 0 1-1-1v-9Z' stroke={stroke(active)} strokeWidth={1.8} />
    </Svg>
  );
}

export function AnalysisIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 22 22' fill='none'>
      <Path d='M4 16.5 8 11l3 2.5 5-7' stroke={stroke(active)} strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' />
      <Rect x={3} y={3} width={16} height={16} rx={4} stroke={stroke(active)} strokeWidth={1.5} />
    </Svg>
  );
}

export function TestsIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 22 22' fill='none'>
      <Rect x={5} y={3} width={12} height={16} rx={3} stroke={stroke(active)} strokeWidth={1.7} />
      <Path d='M8 8h6M8 11h6M8 14h4' stroke={stroke(active)} strokeWidth={1.7} strokeLinecap='round' />
    </Svg>
  );
}

export function NotificationsIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 22 22' fill='none'>
      <Path d='M11 4.5a4 4 0 0 0-4 4v2.2c0 .7-.2 1.4-.6 2l-1.2 1.8h11.6l-1.2-1.8a3.6 3.6 0 0 1-.6-2V8.5a4 4 0 0 0-4-4Z' stroke={stroke(active)} strokeWidth={1.7} />
      <Path d='M9 17a2.4 2.4 0 0 0 4 0' stroke={stroke(active)} strokeWidth={1.7} strokeLinecap='round' />
    </Svg>
  );
}

export function ProfileIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 22 22' fill='none'>
      <Circle cx={11} cy={8} r={3.2} stroke={stroke(active)} strokeWidth={1.7} />
      <Path d='M5 18c1.5-2.4 3.5-3.6 6-3.6s4.5 1.2 6 3.6' stroke={stroke(active)} strokeWidth={1.7} strokeLinecap='round' />
    </Svg>
  );
}

export function ArcheryIcon({ active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox='0 0 24 24' fill='none'>
      <Circle cx="12" cy="12" r="9" stroke={stroke(active)} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="5.5" stroke={stroke(active)} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="2" fill={stroke(active)} />
      <Path d="M17 7l5-5M21 5l1-1M20 4l1 1" stroke={stroke(active)} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
