import { Select, applyDefaultTheme, ITheme, Typography } from '@vikadata/components';
import React, { useState } from 'react';
import { themesMap, themesTransMap } from '../theme';
import styled, { css } from 'styled-components';
import { Scrollbars } from 'react-custom-scrollbars';
import { Strings, t } from '../i18n';


type ThemeSelectProps = {
  value: string,
  onChange: (value: string) => void;
};

const ThemeSelectWrapper = styled.div.attrs(applyDefaultTheme)`
  box-shadow: 0px 8px 24px 0px rgba(38,38,38,0.16);
  overflow: auto;
  padding: 8px;
  border-radius: 4px;
`;

const ThemeItemWrapper = styled.div.attrs(applyDefaultTheme) <{ isActive: boolean }>`
  border-radius: 4px;
  display: flex;
  width: 100%;
  height: 32px;
  padding: 4px;
  cursor: pointer;
  margin-bottom: 8px;
  &:hover {
    border: ${props => `1px solid ${(props.theme as ITheme).palette.primary}`};
  }
  ${(props) => {
    if (props.isActive) {
      return css`
          border: 1px solid ${(props.theme as ITheme).palette.primary};
      `;
    }
    return;
  }}
`;

const ThemeColorSpan = styled.div`
  height: 100%;
  width: 100%;
`;

const themes = Object.keys(themesMap);
const ThemeSelectBase = ({ defaultValue, onChange }: {
  defaultValue: any,
  onChange?: (value: any) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const handleThemeClick = (value) => {
    setValue(value);
    onChange && onChange(value);
  };

  const multiColorTheme = themes.slice(0, 4);
  // FIXME: i18n
  const singleColorTheme = themes.slice(4);

  return <Scrollbars
    autoHide
    style={{
      width: 276,
      height: 520,
    }}
  >
    <ThemeSelectWrapper >
      <Typography variant='body4'>{t(Strings.colorful_theme)}</Typography>
      <div style={{ marginTop: 3, marginBottom: 12 }}>
        {
          multiColorTheme.map((themeKey, index) => {
            const isActive = value === themeKey;
            return (
              <ThemeItemWrapper key={themeKey} onClick={() => handleThemeClick(themeKey)} isActive={isActive}>
                {themesMap[themeKey].colors20.map(color => <ThemeColorSpan style={{ background: color }} />)}
              </ThemeItemWrapper>
            );
          })
        }
      </div>
      <Typography variant='body4'>{t(Strings.single_color_gradient_theme)}</Typography>
      <div style={{ marginTop: 3 }}>
        {
          singleColorTheme.map((themeKey, index) => {
            const isActive = value === themeKey;
            return (
              <ThemeItemWrapper key={themeKey} onClick={() => handleThemeClick(themeKey)} isActive={isActive}>
                {themesMap[themeKey].colors10.map(color => <ThemeColorSpan style={{ background: color }} />)}
              </ThemeItemWrapper>
            );
          })
        }
      </div>
    </ThemeSelectWrapper>
  </Scrollbars>;
};

export const ThemeSelect = ({ value, onChange }: ThemeSelectProps) => {
  const options = themes.map(themeKey => ({ value: themeKey, label: themesTransMap[themeKey] }));
  return (
    <Select
      placeholder={t(Strings.pick_one_option)}
      options={options}
      value={value}
      onSelected={(option) => {
        onChange(option.value as any);
      }}
      dropdownMatchSelectWidth
      triggerStyle={{ width: '100%' }}
      dropdownRender={<ThemeSelectBase onChange={onChange} defaultValue={value} />}
      noDataTip={t(Strings.empty_data)}
    />
  );
};
