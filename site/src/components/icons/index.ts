// Base Icon component
export { default as Icon } from "./Icon";

// Icon types
export type { IconProps, IconComponent } from "./types";

// Custom Icons
export { default as CheckIcon } from "./CheckIcon";
export { default as ChevronDownIcon } from "./ChevronDownIcon";
export { default as SpinnerIcon } from "./SpinnerIcon";
export { default as XIcon } from "./XIcon";
export { default as AlertIcon, AlertCircleIcon } from "./AlertIcon";
export { default as GoogleIcon } from "./GoogleIcon";
export { default as FacebookIcon } from "./FacebookIcon";

// Action icons
export { CloudUploadIcon, CheckCircleIcon, XCircleIcon, RefreshIcon as RefreshCustomIcon, TrashIcon as TrashCustomIcon, DownloadIcon as DownloadCustomIcon } from './ActionIcon';

// Navigation icons  
export { MenuIcon as MenuCustomIcon, HomeIcon as HomeCustomIcon, BackIcon, ForwardIcon } from './NavigationIcon';

// Video icons
export { PlayIcon as PlayCustomIcon, PauseIcon as PauseCustomIcon, VolumeIcon as VolumeCustomIcon, VolumeMutedIcon as VolumeMutedCustomIcon, FullscreenIcon, ExitFullscreenIcon } from './VideoIcon';

// Status icons
export { ErrorIcon, WarningIcon, InfoIcon as InfoCustomIcon, SuccessIcon, LoadingIcon } from './StatusIcon';

// Course-specific icons
export {
  DashboardIcon,
  ChevronRightIcon as CourseChevronRightIcon,
  CoursesIcon,
  ClockIcon as CourseClockIcon,
  CheckCircleIcon as CourseCheckCircleIcon,
  VideoLessonsIcon,
  CourseContentIcon,
  BackArrowIcon,
  SuccessCheckIcon,
} from "./CourseIcon";

// Credit Card Icons
export { VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon, CreditCardIcons } from './CreditCardIcons';

// Payment Icons
export { default as GooglePayIcon } from './GooglePayIcon';
export { default as CardIcon } from './CardIcon';

// Re-export commonly used Lucide icons with consistent naming
export {
  Send as SendIcon,
  Image as ImageIcon,
  AlertTriangle as AlertTriangleIcon,
  Upload as UploadIcon,
  Cookie as CookieIcon,
  Settings as SettingsIcon,
  Check as CheckLucideIcon,
  X as XLucideIcon,
  Menu as MenuIcon,
  User as UserIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownLucideIcon,
  ChevronUp as ChevronUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Volume2 as VolumeIcon,
  VolumeX as VolumeMutedIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  RotateCcw as RotateIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Calendar as CalendarIcon,
  Clock as ClockLucideIcon,
  MapPin as LocationIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Globe as GlobeIcon,
  Home as HomeIcon,
  Users as UsersIcon,
  User2 as User2Icon,
  Settings2 as Settings2Icon,
  HelpCircle as HelpIcon,
  Info as InfoIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  Folder as FolderIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  Bluetooth as BluetoothIcon,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Camera as CameraIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  MousePointer as CursorIcon,
  Keyboard as KeyboardIcon,
  Printer as PrinterIcon,
  Save as SaveIcon,
  Upload as Upload2Icon,
  Download as Download2Icon,
  RefreshCw as RefreshIcon,
  RotateCw as RotateClockwiseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Move as MoveIcon,
  Crop as CropIcon,
  Scissors as ScissorsIcon,
  PaintBucket as PaintIcon,
  Palette as PaletteIcon,
  Brush as BrushIcon,
  Type as TextIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  List as ListIcon,
  Grid as GridIcon,
  MoreVertical as MoreVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  CloudRain as RainIcon,
  Zap as ZapIcon,
  Flame as FlameIcon,
  Droplets as DropletsIcon,
  Wind as WindIcon,
  Thermometer as ThermometerIcon,
  Activity as ActivityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon,
  Gift as GiftIcon,
  ShoppingCart as CartIcon,
  CreditCard as CreditCardIcon,
  DollarSign as DollarIcon,
  Percent as PercentIcon,
  Calculator as CalculatorIcon,
  TrendingUp as GraphIcon,
} from "lucide-react";

// Common icon sizes
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
} as const;

// Utility function for consistent icon sizing
export const getIconSize = (size: keyof typeof ICON_SIZES | number): number => {
  return typeof size === "number" ? size : ICON_SIZES[size];
};