import { WidgetProps } from '@rjsf/core';
import { applyDefaultTheme, ITheme, Select, IOption, useTheme } from '@vikadata/components';
import { FieldType, useActiveViewId, Field, useFields, useField, t } from '@vikadata/widget-sdk';
import React from 'react';
import {
  ColumnAttachmentFilled,
  ColumnAutonumberFilled,
  AccountFilled,
  ColumnCheckboxFilled,
  ColumnLastmodifiedtimeFilled,
  ColumnTextFilled,
  ColumnCreatedbyFilled,
  ColumnCreatedtimeFilled,
  ColumnSingleFilled,
  ColumnCurrencyFilled,
  ColumnEmailFilled,
  ColumnFormulaFilled,
  ColumnPercentFilled,
  ColumnFigureFilled,
  ColumnMultipleFilled,
  ColumnCalendarFilled,
  ColumnLinktableFilled,
  ColumnUrlOutlined,
  ColumnLastmodifiedbyFilled,
  ColumnLongtextFilled,
  LockFilled,
  ColumnPhoneFilled,
  ColumnLookupFilled,
  ColumnRatingFilled,
} from '@vikadata/icons';
import { SELECT_OPEN_SEARCH_COUNT } from '../const';
import styled from 'styled-components';
import { Strings } from '../i18n';

const FieldIconMap = {
  // [FieldType.DeniedField]: LockFilled,
  [FieldType.Text]: ColumnLongtextFilled, // FIXME: icon
  [FieldType.Number]: ColumnFigureFilled, // FIXME: icon 命名有问题。
  [FieldType.SingleSelect]: ColumnSingleFilled,
  [FieldType.MultiSelect]: ColumnMultipleFilled,
  [FieldType.DateTime]: ColumnCalendarFilled, // FIXME: icon 命名有问题。
  [FieldType.Attachment]: ColumnAttachmentFilled,
  [FieldType.MagicLink]: ColumnLinktableFilled, // ?
  [FieldType.URL]: ColumnUrlOutlined,
  [FieldType.Email]: ColumnEmailFilled,
  [FieldType.Phone]: ColumnPhoneFilled,
  [FieldType.Checkbox]: ColumnCheckboxFilled,
  [FieldType.Rating]: ColumnRatingFilled,
  [FieldType.Member]: AccountFilled,
  [FieldType.MagicLookUp]: ColumnLookupFilled,
  [FieldType.Formula]: ColumnFormulaFilled,
  [FieldType.Currency]: ColumnCurrencyFilled,
  [FieldType.Percent]: ColumnPercentFilled,
  [FieldType.SingleText]: ColumnTextFilled,
  [FieldType.AutoNumber]: ColumnAutonumberFilled,
  [FieldType.CreatedTime]: ColumnCreatedtimeFilled,
  [FieldType.LastModifiedTime]: ColumnLastmodifiedtimeFilled,
  [FieldType.CreatedBy]: ColumnCreatedbyFilled,
  [FieldType.LastModifiedBy]: ColumnLastmodifiedbyFilled,
};

const transformOptions = (enumOptions: { label: string, value: any }[], theme: ITheme, fields: Field[]) => {
  const fieldMap = new Map(fields.map(field => [field.id, field]));
  return enumOptions.map(option => {
    const res = {
      label: option.label,
      value: option.value,
    };
    const field = fieldMap.get(option.value);
    if (!field) {
      return res;
    }
    const FieldIcon = FieldIconMap[field.type];
    return {
      ...res,
      // disabled: field.type === FieldType.DeniedField,
      prefixIcon: <FieldIcon color={theme.palette.text.third} />,
    };
  });
};

const ErrorText = styled.div.attrs(applyDefaultTheme)`
  font-size: 10px;
  padding: 4px 0 0 8px;
  color: ${(props) => props.theme.palette.danger};
`;

export const FieldSelect = ({ options: { enumOptions }, value: fieldId, onChange, rawErrors, viewId }: WidgetProps) => {
  const theme = useTheme();
  const fields = useFields(viewId);
  const field = useField(fieldId);
  const _options: IOption[] = transformOptions(enumOptions as any, theme as ITheme, fields);
  // 字段选择的错误，只有已选字段被删除的情况
  const hasError = Boolean(rawErrors?.length);
  const style = hasError ? { border: '1px solid red', width: '100%' } : { width: '100%' };
  return <>
    <Select
      placeholder={t(Strings.pick_one_option)}
      options={_options}
      value={fieldId}
      triggerStyle={style}
      onSelected={(option) => {
        onChange(option.value);
      }}
      hideSelectedOption={!field}
      dropdownMatchSelectWidth
      openSearch={_options.length > SELECT_OPEN_SEARCH_COUNT}
      searchPlaceholder={t(Strings.search)}
      noDataTip={t(Strings.empty_data)}
    />
    {
      hasError && <ErrorText>{t(Strings.chart_option_field_had_been_deleted)}</ErrorText>
    }
  </>;
};
