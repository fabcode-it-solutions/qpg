export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'data-testid'?: string;
}

export interface IconComponent extends React.FC<IconProps> {
  displayName?: string;
}