// W 白紙配色（參考 todo mate、Structured）：介面黑白，彩度只留給專案和截止
export const colors = {
  bg: '#FFFFFF',
  card: '#F4F4F2',
  line: '#E8E8E6',
  ink: '#111111',
  ink2: '#4F4F4F',
  ink3: '#6D6D6D',
  muted: '#A3A3A3',
  due: '#E5484D',      // 今天、明天的截止
  dueBg: '#FDECEC',
  toastAccent: '#FFB4A8',
  project: {
    dongLin: '#FF7A59',
    ymt: '#5B7FA6',
    pets: '#7FA578',
    life: '#8E6FA8',
  },
} as const;

export const radius = { chip: 8, card: 16, button: 14, pill: 999 } as const;
