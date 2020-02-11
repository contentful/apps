import React from "react";
import { ToggleButton } from "@contentful/forma-36-react-components";
import { PickerMode } from "../interfaces";
import { css } from "emotion";
import tokens from "@contentful/forma-36-tokens";

const styles = {
  toggleGroup: isPickerModeSetToSku =>
    css({
      marginTop: tokens.spacingXs,
      marginLeft: tokens.spacingL,

      "> :first-of-type": css({
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        position: "relative",
        zIndex: isPickerModeSetToSku ? 1 : 0
      }),
      "> :last-of-type": css({
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        marginLeft: "-1px",
        position: "relative",
        zIndex: isPickerModeSetToSku ? 0 : 1
      })
    })
};

interface Props {
  activePickerMode: PickerMode;
  onChange: (pickerMode: PickerMode) => void;
}

export function ToggleGroup({ activePickerMode, onChange }: Props) {
  const isPickerModeSetToSku = activePickerMode === "sku";
  return (
    <div className={styles.toggleGroup(isPickerModeSetToSku)}>
      <ToggleButton
        onToggle={() => onChange("sku")}
        isActive={isPickerModeSetToSku}
      >
        SKU
      </ToggleButton>
      <ToggleButton
        onToggle={() => onChange("category")}
        isActive={!isPickerModeSetToSku}
      >
        Category
      </ToggleButton>
    </div>
  );
}
