import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import tokens from '@contentful/f36-tokens';
import { parseRemToPxInt } from 'helpers/parse-styling-token/parse-styling-token';

const ACCESSIBILITY_LABEL = 'Analytics line chart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

const defaultFontSize = parseRemToPxInt(tokens.fontSizeS);

ChartJS.defaults.font.size = defaultFontSize;
ChartJS.defaults.font.family = tokens.fontStackPrimary;
ChartJS.defaults.font.weight = tokens.fontWeightMedium.toString();
ChartJS.defaults.borderColor = tokens.gray200;
ChartJS.defaults.datasets.line.borderColor = tokens.colorPrimary;

interface Props {
  dataValues: number[];
  xAxisLabels: string[];
  tooltipMetricLabel?: string;
  accessibilityLabel?: string;
}

const Y_AXIS_SCALAR = 1.2;

const LineChart = (props: Props) => {
  const { dataValues, xAxisLabels, tooltipMetricLabel, accessibilityLabel } = props;
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data: ChartData<'line'> = {
    labels: xAxisLabels,
    datasets: [
      {
        data: dataValues,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    // no animation needed when mounting
    animation: isMounted ? { duration: 1000 } : false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(...dataValues) * Y_AXIS_SCALAR,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: tokens.gray900,
        bodyColor: tokens.colorWhite,
        padding: parseRemToPxInt(tokens.spacingXs),
        titleMarginBottom: parseRemToPxInt(tokens.spacing2Xs),
        titleFont: {
          size: defaultFontSize,
        },
        bodyFont: {
          size: defaultFontSize,
          // TO:DO once font weight is added to F36, replace with token
          weight: '700',
        },
        displayColors: false,
        callbacks: {
          beforeBody: () => tooltipMetricLabel,
        },
      },
    },
  };

  const chartProps = {
    'aria-label': accessibilityLabel,
  };

  return (
    <Line data={data} options={options} fallbackContent={accessibilityLabel} {...chartProps} />
  );
};

LineChart.defaultProps = {
  accessibilityLabel: ACCESSIBILITY_LABEL,
};

export default LineChart;
