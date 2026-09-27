import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export default function RoomBackdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Rect width={390} height={540} fill="#F5ECDC" />
      <Rect y={540} width={390} height={304} fill="#EDDFC8" />
      <Path d="M0 540H390" stroke="#E2D1B6" strokeWidth={2} />

      <Path d="M84 340V224a62 62 0 0 1 124 0v116Z" fill="#FDF8EE" stroke="#E6D7BF" strokeWidth={6} />
      <Path d="M146 162V340M84 256H208" stroke="#E6D7BF" strokeWidth={3.5} />
      <Path d="M96 540H214l54 110H132Z" fill="#F5EAD8" opacity={0.9} />

      <Circle cx={36} cy={372} r={66} fill="#FBE3BD" opacity={0.5} />
      <Path d="M36 384V640" stroke="#BFA888" strokeWidth={3.5} />
      <Ellipse cx={36} cy={642} rx={19} ry={5} fill="#BFA888" />
      <Path d="M14 384H58l-8-32H22Z" fill="#F2C98F" />

      <Rect x={244} y={146} width={84} height={66} rx={5} fill="#D9BC92" stroke="#BF9E72" strokeWidth={3} />
      <Rect x={254} y={158} width={26} height={20} rx={2} fill="#FFF7E8" transform="rotate(-5 254 158)" />
      <Rect x={286} y={164} width={30} height={23} rx={2} fill="#FFF7E8" transform="rotate(4 286 164)" />
      <Rect x={262} y={184} width={24} height={17} rx={2} fill="#F6DFC2" transform="rotate(3 262 184)" />
      <Circle cx={266} cy={158} r={2.5} fill="#E07A5F" />
      <Circle cx={300} cy={164} r={2.5} fill="#7FA578" />
      <Circle cx={274} cy={184} r={2.5} fill="#5B7FA6" />

      <Rect x={238} y={266} width={140} height={8} rx={4} fill="#D8C1A0" />
      <Path d="M252 266v-21h10v21M265 266v-28h11v28M279 266v-18h11v18" fill="#D69B73" />
      <Path d="M318 265h22l-3-22h-16Z" fill="#E6BD72" />
      <Path d="M326 243v-7h6v7M322 252h-8c0 8 4 11 10 11M338 252h8c0 8-4 11-10 11" fill="none" stroke="#C69249" strokeWidth={2} />

      <Ellipse cx={195} cy={652} rx={172} ry={44} fill="#E6D4B8" />
      <Ellipse cx={195} cy={652} rx={150} ry={34} fill="none" stroke="#DCC6A6" strokeWidth={2} strokeDasharray="3 6" />
      <Rect x={330} y={486} width={32} height={150} rx={4} fill="none" stroke="#CDBBA0" strokeWidth={2} strokeDasharray="5 5" />
      <Rect x={316} y={474} width={60} height={13} rx={4} fill="none" stroke="#CDBBA0" strokeWidth={2} strokeDasharray="5 5" />

      <Path d="M40 712h50a25 13 0 0 1-50 0Z" fill="#FFF" stroke="#DFD1BA" strokeWidth={2} />
      <Circle cx={292} cy={712} r={14} fill="#FF7A59" />
      <Path d="M281 706q11 4 22-1M280 714q12 5 24-1M286 700q-2 11 3 24" fill="none" stroke="#D95E42" strokeWidth={1.5} />
    </Svg>
  );
}
