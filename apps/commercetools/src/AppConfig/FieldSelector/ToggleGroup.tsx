import React from "react";
import { ToggleButton } from "@contentful/forma-36-react-components";
import { PickerMode } from "../../interfaces";
import { css } from "emotion";
import tokens from "@contentful/forma-36-tokens";

const styles = {
  toggleGroup: (isPickerModeSetToProduct: boolean) =>
    css({
      marginTop: tokens.spacingXs,
      marginLeft: tokens.spacingL,

      "> :first-of-type": css({
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        position: "relative",
        zIndex: isPickerModeSetToProduct ? 1 : 0
      }),
      "> :last-of-type": css({
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        marginLeft: "-1px",
        position: "relative",
        zIndex: isPickerModeSetToProduct ? 0 : 1
      })
    })
};

interface Props {
  activePickerMode: PickerMode;
  onChange: (pickerMode: PickerMode) => void;
}

export function ToggleGroup({ activePickerMode, onChange }: Props) {
  const isPickerModeSetToProduct = activePickerMode === "product";
  return (
    <div className={styles.toggleGroup(isPickerModeSetToProduct)}>
      <ToggleButton
        onToggle={() => onChange("product")}
        isActive={isPickerModeSetToProduct}
      >
        Product
      </ToggleButton>
      <ToggleButton
        onToggle={() => onChange("category")}
        isActive={!isPickerModeSetToProduct}
      >
        Category
      </ToggleButton>
    </div>
  );
}
