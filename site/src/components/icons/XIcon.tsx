import React from "react";
import Icon from "./Icon";
import { IconComponent } from "./types";

export const XIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </Icon>
);

XIcon.displayName = "XIcon";
export default XIcon;