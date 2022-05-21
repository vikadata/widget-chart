import { initializeWidget } from '@vikadata/widget-sdk';
import { WidgetChart } from './chart';

initializeWidget(WidgetChart, process.env.WIDGET_PACKAGE_ID);
