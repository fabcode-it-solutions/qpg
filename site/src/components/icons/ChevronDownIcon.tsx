import React from "react";
import Icon from "./Icon";
import { IconComponent } from "./types";

export const ChevronDownIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

ChevronDownIcon.displayName = "ChevronDownIcon";
export default ChevronDownIcon;