import React from "react";
import Icon from "./Icon";
import { IconComponent } from "./types";

export const MenuIcon: IconComponent = (props) => (
  <Icon {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Icon>
);

export const HomeIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </Icon>
);

export const BackIcon: IconComponent = (props) => (
  <Icon {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12,19 5,12 12,5" />
  </Icon>
);

export const ForwardIcon: IconComponent = (props) => (
  <Icon {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </Icon>
);

MenuIcon.displayName = "MenuIcon";
HomeIcon.displayName = "HomeIcon";
BackIcon.displayName = "BackIcon";
ForwardIcon.displayName = "ForwardIcon";

export default MenuIcon;