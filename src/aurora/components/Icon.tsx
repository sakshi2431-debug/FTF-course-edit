/* Original exports from the Figma frames. Each frame has its own colour variant of an icon. */
const asset = {
  /* Instructor navigation, Figma 4074:7176 */
  sidebar: "09946.svg",
  moon: "3e831.svg",
  logo: "39add.svg",
  home: "f5380.svg",
  user: "91842.svg",
  book: "29ba8.svg",
  fileText: "2c6f6.svg",
  aiOutline: "1fcb8.svg",
  checkSquare: "08524.svg",
  support: "466e7.svg",
  settings: "2abc0.svg",
  logout: "53c92.svg",
  dividerTop: "67484.svg",
  dividerBottom: "230cc.svg",
  dividerVertical: "945cb.svg",
  /* Plan screen, Figma 3165:15612 */
  dot: "6daab.svg",
  back: "a23ce.svg",
  next: "a20e6.svg",
  drag: "c0b16.svg",
  unitDown: "60d5e.svg",
  unitUp: "db528.svg",
  lessonSelected: "5f31a.svg",
  lessonDefault: "8d3ff.svg",
  lessonContent: "5141e.svg",
  quiz: "b58c3.svg",
  video: "daa26.svg",
  plus: "4d894.svg",
  addChevron: "931a5.svg",
  upload: "6f37f.svg",
  edit: "36120.svg",
  check: "ccd15.svg",
  code: "a186b.svg",
  copy: "92d6b.svg",
  aiButton: "d42cb.svg",
  trash: "57d8c.svg",
  /* Aurora panel, Figma 3154:13244 */
  aurora: "bb16e.svg",
  auroraSmall: "693c1.svg",
  more: "58731.svg",
  close: "e5c70.svg",
  paperclip: "3e9d5.svg",
  send: "76e80.svg",
  radioOn: "36a66.svg",
  pickerBack: "17910.svg",
  /* Progress pattern, Figma 3012:2175 */
  loader: "761df.svg",
  stepDone: "66ae9.svg",
  stepActive: "7d022.svg",
  /* Upload rows, Figma 3190:18388 */
  statusCheck: "d2faf.svg",
  fileRed: "c8ff6.svg",
  fileOrange: "bd487.svg",
  fileBlue: "fcbe2.svg",
  link: "9a8b9.svg",
  remove: "9cced.svg",
  /* Validate Course, Figma 3795:5511 */
  alert: "f17d8.svg",
  checkList: "3fb5b.svg",
  checkBook: "ef34a.svg",
  checkFile: "f36ac.svg",
  checkTarget: "7ad26.svg",
  overview: "f7c6e.svg",
  clock: "876a1.svg",
  /* Review and publish, Figma 3188:17126 */
  eye: "1ac78.svg",
  reviewBook: "84583.svg",
  reviewHelp: "bd184.svg",
  units: "53e6b.svg",
  globe: "a33bb.svg",
  userPlus: "9284b.svg",
  calendar: "8db58.svg",
  bell: "6a7d1.svg",
  summaryFile: "7a1c4.svg",
  readyCheck: "0f19d.svg",
  info: "03691.svg",
  tipCheck: "8c67e.svg",
  nextArrow: "12324.svg",
  /* Add video, Figma 3600:9459 */
  videoLarge: "9ee18.svg",
} as const;

export type IconName = keyof typeof asset;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return <img className={className} src={`/assets/${asset[name]}`} alt="" />;
}
