/* eslint-disable max-len */
import {
  purple, deepPurple, indigo, blue, teal,
  green, yellow, orange, tangerine, pink, red, brown,
} from '@vikadata/components';
import { t } from '@vikadata/widget-sdk';
import { Strings } from './i18n';

// 内置的 4 套主题配色
export const theme1 = {
  defaultColor: '#7B67EE',
  colors10: ['#7B67EE', '#5B8FF9', '#61DDAA', '#65789B', '#F6BD16', '#6F5EF9', '#78D3F8', '#9661BC', '#F6903D', '#F08BB4'],
  colors20: ['#7B67EE', '#5B8FF9', '#CDDDFD', '#61DDAA', '#CDF3E4', '#65789B', '#CED4DE', '#F6BD16', '#6F5EF9', '#D3CEFD', '#78D3F8', '#D3EEF9', '#9661BC', '#DECFEA', '#F6903D', '#FFE0C7', '#008685', '#BBDEDE', '#F08BB4', '#FFE0ED'],
};

export const theme3 = {
  defaultColor: '#FF6B3B',
  colors10: ['#FF6B3B', '#626681', '#FFC100', '#9FB40F', '#76523B', '#DAD5B5', '#0E8E89', '#E19348', '#F383A2', '#247FEA'],
  colors20: ['#FF6B3B', '#626681', '#FFC100', '#9FB40F', '#76523B', '#DAD5B5', '#0E8E89', '#E19348', '#F383A2', '#247FEA', '#2BCB95', '#B1ABF4', '#1D42C2', '#1D9ED1', '#D64BC0', '#255634', '#8C8C47', '#8CDAE5', '#8E283B', '#791DC9'],
};

export const theme2 = {
  defaultColor: '#025DF4',
  colors10: ['#025DF4', '#DB6BCF', '#2498D1', '#BBBDE6', '#4045B2', '#21A97A', '#FF745A', '#007E99', '#FFA8A8', '#2391FF'],
  colors20: ['#025DF4', '#DB6BCF', '#2498D1', '#BBBDE6', '#4045B2', '#21A97A', '#FF745A', '#007E99', '#FFA8A8', '#2391FF', '#FFC328', '#A0DC2C', '#946DFF', '#626681', '#EB4185', '#CD8150', '#36BCCB', '#327039', '#803488', '#83BC99'],
};

export const theme4 = {
  defaultColor: '#FF4500',
  colors10: ['#FF4500', '#1AAF8B', '#406C85', '#F6BD16', '#B40F0F', '#2FB8FC', '#4435FF', '#FF5CA2', '#BBE800', '#FE8A26'],
  colors20: ['#FF4500', '#1AAF8B', '#406C85', '#F6BD16', '#B40F0F', '#2FB8FC', '#4435FF', '#FF5CA2', '#BBE800', '#FE8A26', '#946DFF', '#6C3E00', '#6193FF', '#FF988E', '#36BCCB', '#004988', '#FFCF9D', '#CCDC8A', '#8D00A1', '#1CC25E'],
};

const colorKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const getColorTheme = (color) => {
  return {
    defaultColor: color[500],
    colors10: colorKeys.map(key => color[key]),
    colors20: colorKeys.map(key => color[key]),
  };
};

// const colors = [purple, deepPurple, indigo, blue, teal, green, yellow, orange, tangerine, pink, red, brown];

export const themesMap = {
  theme1: theme1,
  theme2: theme2,
  theme3: theme3,
  theme4: theme4,
  theme_purple: getColorTheme(purple),
  theme_deepPurple: getColorTheme(deepPurple),
  theme_indigo: getColorTheme(indigo),
  theme_blue: getColorTheme(blue),
  theme_teal: getColorTheme(teal),
  theme_green: getColorTheme(green),
  theme_yellow: getColorTheme(yellow),
  theme_orange: getColorTheme(orange),
  theme_tangerine: getColorTheme(tangerine),
  theme_pink: getColorTheme(pink),
  theme_red: getColorTheme(red),
  theme_brown: getColorTheme(brown),
};

export const themesTransMap = {
  theme1: t(Strings.theme_color_1),
  theme2: t(Strings.theme_color_2),
  theme3: t(Strings.theme_color_3),
  theme4: t(Strings.theme_color_4),
  theme_purple: t(Strings.theme_purple),
  theme_deepPurple: t(Strings.theme_deepPurple),
  theme_indigo: t(Strings.theme_indigo),
  theme_blue: t(Strings.theme_blue),
  theme_teal: t(Strings.theme_teal),
  theme_green: t(Strings.theme_green),
  theme_yellow: t(Strings.theme_yellow),
  theme_orange: t(Strings.theme_orange),
  theme_tangerine: t(Strings.theme_tangerine),
  theme_pink: t(Strings.theme_pink),
  theme_red: t(Strings.theme_red),
  theme_brown: t(Strings.theme_brown),
};