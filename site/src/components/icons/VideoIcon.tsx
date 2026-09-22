import React from "react";
import Icon from "./Icon";
import { IconComponent } from "./types";

export const PlayIcon: IconComponent = (props) => (
  <Icon {...props} viewBox="0 0 24 24">
    <polygon points="6,3 20,12 6,21" fill="currentColor" />
  </Icon>
);

export const PauseIcon: IconComponent = (props) => (
  <Icon {...props} viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
  </Icon>
);

export const VolumeIcon: IconComponent = (props) => (
  <Icon {...props}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M19.07,4.93A10,10,0,0,1,23,12a10,10,0,0,1-3.93,7.07" />
    <path d="M15.54,8.46A5,5,0,0,1,17,12a5,5,0,0,1-1.46,3.54" />
  </Icon>
);

export const VolumeMutedIcon: IconComponent = (props) => (
  <Icon {...props}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </Icon>
);

export const FullscreenIcon: IconComponent = (props) => (
  <Icon {...props} viewBox="0 0 24 24">
    <polyline points="15,3 21,3 21,9" />
    <polyline points="9,21 3,21 3,15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Icon>
);

export const ExitFullscreenIcon: IconComponent = (props) => (
  <Icon {...props} viewBox="0 0 24 24">
    <polyline points="4,14 10,14 10,20" />
    <polyline points="20,10 14,10 14,4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Icon>
);

PlayIcon.displayName = "PlayIcon";
PauseIcon.displayName = "PauseIcon";
VolumeIcon.displayName = "VolumeIcon";
VolumeMutedIcon.displayName = "VolumeMutedIcon";
FullscreenIcon.displayName = "FullscreenIcon";
ExitFullscreenIcon.displayName = "ExitFullscreenIcon";

export default PlayIcon;