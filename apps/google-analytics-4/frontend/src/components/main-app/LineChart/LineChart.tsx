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
import { styles } from './LineChart.styles';

const ACCESSIBILITY_LABEL = 'Analytics line chart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

const defaultFontSize = parseRemToPxInt(tokens.fontSizeS);

ChartJS.defaults.font.size = defaultFontSize;
ChartJS.defaults.font.family = tokens.fontStackPrimary;
ChartJS.defaults.font.weight = tokens.fontWeightMedium;
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
          weight: tokens.fontWeightDemiBold,
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
    <div className={styles.root}>
      <Line data={data} options={options} fallbackContent={accessibilityLabel} {...chartProps} />
    </div>
  );
};

LineChart.defaultProps = {
  accessibilityLabel: ACCESSIBILITY_LABEL,
};

export default LineChart;
