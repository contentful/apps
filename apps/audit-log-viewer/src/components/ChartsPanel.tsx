import { Box, Flex, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useMemo, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { eventsPerDay, topBy, type AuditEvent } from '../lib/events';

const t = tokens as unknown as Record<string, string>;
const LINE = t.colorDatavizCategorical1Default;
const BAR_A = t.colorDatavizCategorical1Default;
const BAR_B = t.colorDatavizCategorical2Default;

const GRIDLINE = t.colorDatavizChartGridline;
const AXIS_LINE = tokens.colorElementMid;
const AXIS_TICK = t.colorDatavizAxisLabels;
const SURFACE = tokens.colorElementLightest;
const INK_PRIMARY = tokens.colorBlack;
const CURSOR_WASH = tokens.colorElementLight;

const tooltipContentStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${tokens.colorElementMid}`,
  borderRadius: tokens.borderRadiusMedium,
  padding: `${tokens.spacingXs} ${tokens.spacingS}`,
  boxShadow: tokens.boxShadowDefault,
};

/**
 * A minimal custom tooltip that follows the dataviz skill's interaction
 * guidance: values lead (bold, high-contrast) and the label follows
 * (secondary, muted); the series is keyed with a short line stroke rather
 * than a filled box.
 */
const makeTooltip =
  (color: string) =>
  ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    return (
      <Box style={tooltipContentStyle}>
        <Flex alignItems="center" gap="spacingXs">
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 2,
              background: color,
              borderRadius: 1,
            }}
          />
          <strong style={{ color: INK_PRIMARY, fontSize: tokens.fontSizeM }}>
            {payload[0]?.value}
          </strong>
        </Flex>
        <Box style={{ color: AXIS_TICK, fontSize: tokens.fontSizeS, marginTop: tokens.spacing2Xs }}>
          {label}
        </Box>
      </Box>
    );
  };

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box
    padding="spacingM"
    style={{
      border: `1px solid ${tokens.colorElementMid}`,
      borderRadius: tokens.borderRadiusMedium,
      flex: '1 1 320px',
      minWidth: 320,
    }}>
    <Subheading marginBottom="spacingS">{title}</Subheading>
    <Box style={{ width: '100%', height: 220 }}>{children}</Box>
  </Box>
);

export const ChartsPanel = ({ events }: { events: AuditEvent[] }) => {
  // Memoized: events can be thousands and the parent re-renders on filter typing.
  const perDay = useMemo(() => eventsPerDay(events), [events]);
  const topActors = useMemo(() => topBy(events, (e) => e.actorName, 8), [events]);
  const topActions = useMemo(() => topBy(events, (e) => e.activity, 8), [events]);

  return (
    <Flex gap="spacingM" flexWrap="wrap">
      <Card title="Events over time">
        <ResponsiveContainer>
          <LineChart data={perDay} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <Tooltip content={makeTooltip(LINE)} cursor={{ stroke: AXIS_LINE, strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={LINE}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: LINE, stroke: SURFACE, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Top actors">
        <ResponsiveContainer>
          <BarChart data={topActors} layout="vertical" margin={{ top: 8, right: 8, left: 24 }}>
            <CartesianGrid stroke={GRIDLINE} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <Tooltip content={makeTooltip(BAR_A)} cursor={{ fill: CURSOR_WASH }} />
            <Bar dataKey="count" fill={BAR_A} radius={[0, 4, 4, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Actions">
        <ResponsiveContainer>
          <BarChart data={topActions} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: tokens.fontSizeS, fill: AXIS_TICK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <Tooltip content={makeTooltip(BAR_B)} cursor={{ fill: CURSOR_WASH }} />
            <Bar dataKey="count" fill={BAR_B} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Flex>
  );
};
