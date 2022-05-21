export type IOutputRecordData = {
  dimensionOrigin?: any;
  dimension?: any;
  metrics?: any;
  series?: any;
};

export interface IOutputChartData {
  [propsname: string]: string | number;
}