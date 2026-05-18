"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QuestionAnalytics } from "@/lib/services/analytics.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = [
  "hsl(173 58% 39%)",
  "hsl(199 89% 48%)",
  "hsl(262 83% 58%)",
  "hsl(24 95% 53%)",
  "hsl(340 82% 52%)",
  "hsl(142 71% 45%)",
  "hsl(48 96% 53%)",
  "hsl(217 91% 60%)",
  "hsl(280 67% 52%)",
  "hsl(12 76% 61%)",
];

type SeriesDatum = {
  label: string;
  value: number;
  fill: string;
};

function buildSeries(chartData: { label: string; value: number }[]): SeriesDatum[] {
  return chartData.map((d, index) => ({
    ...d,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.label}`}
          className="flex max-w-[10rem] items-center gap-2 text-xs text-foreground"
        >
          <span
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="leading-snug">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function QuestionChart({ data }: { data: QuestionAnalytics }) {
  if (data.type === "TEXT") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{data.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.textResponses && data.textResponses.length > 0 ? (
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm text-muted-foreground">
              {data.textResponses.map((text, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5"
                >
                  {text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">אין תשובות עדיין</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!data.chartData.length || data.chartData.every((d) => d.value === 0)) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{data.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">אין תשובות עדיין</p>
        </CardContent>
      </Card>
    );
  }

  const series = buildSeries(data.chartData);
  const legendItems = series.map((d) => ({
    label: d.label,
    color: d.fill,
  }));

  const usePie = data.type === "YES_NO";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.averageRating !== undefined && (
          <Badge variant="secondary" className="shrink-0">
            ממוצע: {data.averageRating}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <div dir="ltr">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {usePie ? (
              <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <Pie
                  data={series}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={28}
                  paddingAngle={2}
                  label={false}
                >
                  {series.map((entry, index) => (
                    <Cell key={`${entry.label}-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <BarChart
                data={series}
                margin={{ top: 24, right: 12, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis
                  allowDecimals={false}
                  width={32}
                  tick={{ fontSize: 11 }}
                  tickMargin={4}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {series.map((entry, index) => (
                    <Cell key={`${entry.label}-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    offset={8}
                    style={{ fill: "hsl(215 16% 35%)", fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <ChartLegend items={legendItems} />
        </div>
      </CardContent>
    </Card>
  );
}
