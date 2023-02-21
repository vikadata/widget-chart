import styled, { css } from 'styled-components';
import React from 'react';
import { WarnFilled } from '@apitable/icons';

export const FormWrapper = styled.div<{ openSetting: boolean, readOnly: boolean }>`
  box-shadow: -1px 0px 0px rgba(0, 0, 0, 0.1), 0px -1px 0px #F0F0F6;
  width: 320px;
  flex-shrink: 0;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  display: ${(props) => props.openSetting ? 'block' : 'none'};
  ${(props) => {
    if (props.readOnly) {
      return css`
        pointer-events: none;
        opacity: 0.5;
      `;
    }
    return;
  }}
`;

const ChartWarningWrapper = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WarningAlertInner = styled.div`
  /* Auto Layout */
  display: flex;
  width: max-content;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  background: #fef6e5;
  /* FC14 (warn with color) */

  border: 1px solid #FFAB00;
  box-sizing: border-box;
  border-radius: 6px;
  z-index: 1;
`;

// TODO: Temporary use, replace here when the alert component is finished.
export const WarningAlert = ({ children }) => {

  return <ChartWarningWrapper>
    <WarningAlertInner >
      <WarnFilled />
      <div>{children}</div>
    </WarningAlertInner>
  </ChartWarningWrapper>;
};