import { css } from '@emotion/css';

export const treeContainerStyles = css`
  height: calc(100vh - 105px);
  min-height: 400px;
  max-height: 800px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0 1.5rem;
`;

export const treeNodeStyles = css`
  position: relative;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .tree-node-item {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px 12px;
    background-color: #ffffff;
    position: relative;
    margin-left: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        border-color: #e0e0e0;
        background-color: #ffffff;
        cursor: not-allowed;
      }

      .tree-node-item-checkbox {
        label {
          cursor: not-allowed;
        }
      }
    }

    &.expanded {
      .tree-node-item-children-count {
        visibility: visible !important;
      }
    }

    &:hover {
      border-color: #b0b0b0;
      background-color: #f9f9f9;
      cursor: pointer;
    }

    .tree-node-item-checkbox {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      flex: 1 1 auto;
      margin-top: 5px;
      margin-bottom: 5px;

      &:hover {
        .tree-node-item-children-count {
          visibility: visible;
        }
      }

      .tree-node-item-children-count {
        visibility: hidden;
      }

      label {
        cursor: pointer;
      }

      > * {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
      }
    }
  }

  .tree-node-children {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  &:first-child .tree-node-item::after {
    display: none;
  }

  &.is-last-child .tree-node-item::after {
    height: 50%;
  }

  &.is-last-child .tree-node-children::before {
    display: none;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .tree-node-item {
      padding: 6px 8px;
    }

    .tree-node-children {
      margin-left: 16px;
      padding-left: 12px;
      width: calc(100% - 16px);
      max-width: calc(100% - 16px);
    }
  }

  @media (max-width: 480px) {
    .tree-node-item {
      padding: 4px 6px;
    }

    .tree-node-children {
      margin-left: 12px;
      padding-left: 8px;
      width: calc(100% - 12px);
      max-width: calc(100% - 12px);
    }
  }
`;

export const treeNodeWrapper = css`
  position: relative;
`;

export const treeNodeSpacer = css`
  width: 32px;
  flex-shrink: 0;
`;

export const treeNodeIconButton = css`
  margin-right: 1px;
  width: 5px;
  height: 5px;
  flex-shrink: 0;
`;

export const treeNodeInnerFlex = css`
  min-width: 0;
  width: 100%;
`;

export const treeNodeIcon = css`
  flex-shrink: 0;
`;

export const treeNodeText = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const treeTitleText = css`
  margin-top: 20px;
`;

export const treeLoadingContainer = css`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

export const containerButtons = css`
  float: right;
  margin: 20px 24px 10px 0;
  display: inline-block;
`;

export const containerButtonsDialog = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 16px 18px 16px 0px;
`;

export const containerButtonsRight = css`
  position: absolute;
  right: 24px;
`;
