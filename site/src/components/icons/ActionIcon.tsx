import React from "react";
import Icon from "./Icon";
import { IconComponent } from "./types";

export const CloudUploadIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 01-2.5 8.242" />
    <path d="m12 12-3 3h6l-3-3-3 3" />
    <path d="m12 12v9" />
  </Icon>
);

export const CheckCircleIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const XCircleIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </Icon>
);

export const RefreshIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Icon>
);

export const TrashIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Icon>
);

export const DownloadIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);

CloudUploadIcon.displayName = "CloudUploadIcon";
CheckCircleIcon.displayName = "CheckCircleIcon";
XCircleIcon.displayName = "XCircleIcon";
RefreshIcon.displayName = "RefreshIcon";
TrashIcon.displayName = "TrashIcon";
DownloadIcon.displayName = "DownloadIcon";

export default CloudUploadIcon;