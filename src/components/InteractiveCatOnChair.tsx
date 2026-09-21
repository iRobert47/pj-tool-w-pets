import React from 'react';
import { MiaomiaoV3 } from './MiaomiaoV3';

interface InteractiveCatOnChairProps {
  mode?: 'sitting' | 'sleeping' | 'stretching';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
  className?: string;
  inPomodoro?: boolean;
}

/**
 * Compatibility adapter.
 *
 * All pet surfaces now render the local Miaomiao V3.1 asset.
 * The former Marketplace/Floey runtime URL has been intentionally removed
 * from this component so legacy call sites cannot accidentally render it.
 */
export const InteractiveCatOnChair: React.FC<InteractiveCatOnChairProps> = (props) => {
  return <MiaomiaoV3 {...props} />;
};
