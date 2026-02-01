import { groupBy, keyBy, mapValues, sumBy } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";
import { useCategories } from "./Categories/CategoriesQueries";
import { useCategoryGroups } from "./CategoryGroups/CategoryGroupsQueries";
import { useMonthlyBudget } from "./MonthlyBudgetQueries";
import { useSelectedMonthContext } from "./SelectedMonthContext";

// 15 base colors for category groups (first 10 are most important)
// Red shades moved to end to avoid "overbudgeted" association
// Colors reordered to separate similar hues (blues/greens)
const BASE_COLORS = [
  "#00BBF9", // Sky Blue
  "#F77F00", // Softer Orange
  "#06D6A0", // Emerald
  "#6C7DFF", // Periwinkle Blue
  "#2EC4B6", // Teal
  "#FECB2F", // Warm Yellow
  "#00F5D4", // Aqua
  "#7A2FE0", // Indigo (slightly softer)
  "#8AC926", // Lime Green
  "#559EFF", // Slightly softer Vivid Blue

  "#FFD166", // Warm Gold
  "#FF8C1A", // Amber (slightly muted)
  "#FF4D85", // Pink-Magenta (less aggressive)
  "#EF6C7F", // Coral (softer)
  "#D62828", // True Red (last)
];

// Convert hex to HSL
const hexToHSL = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

// Convert HSL to hex
const hslToHex = (h: number, s: number, l: number): string => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Generate N shades of a base color dynamically
const generateShades = (baseColor: string, count: number): string[] => {
  if (count === 1) return [baseColor];

  const [h, s, l] = hexToHSL(baseColor);

  // Generate shades from lighter to darker
  // Adjust lightness range based on the base lightness
  const minLightness = Math.max(l - 20, 20);
  const maxLightness = Math.min(l + 20, 80);

  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const lightness =
      maxLightness - (i * (maxLightness - minLightness)) / (count - 1);
    shades.push(hslToHex(h, s, lightness));
  }

  return shades;
};

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  percentOfTotal?: number;
  percentOfGroup?: number;
  groupName?: string;
}

const wrapText = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxLength) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const CustomLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle = 0, outerRadius, name, fill } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const lines = wrapText(name || "", 12);
  const lineHeight = 14;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text
      x={x}
      y={startY}
      fill={fill}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-medium"
    >
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const useBudgetChartData = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);
  const { data: categoryGroups = [] } = useCategoryGroups();
  const { data: categories = [] } = useCategories();

  const isFirstRender = useRef(true);
  const isAnimationActive = isFirstRender.current;
  useEffect(() => {
    setTimeout(() => {
      isFirstRender.current = false;
    }, 3_000);
  }, []);

  return useMemo(() => {
    if (!monthlyBudget) {
      return { outerData: [], innerData: [], isAnimationActive };
    }

    const spendCategoriesById = keyBy(
      monthlyBudget.spendCategories,
      "categoryId"
    );

    // Filter to only spending categories
    const spendCategories = categories.filter((cat) => !cat.isIncome);
    const spendCategoryGroups = categoryGroups
      .filter((group) => !group.isIncome)
      .sort((a, b) => a.position - b.position);

    // Group categories by groupId
    const categoriesByGroup = groupBy(
      spendCategories.sort((a, b) => a.position - b.position),
      "groupId"
    );

    // Calculate group totals
    const groupTotals = mapValues(categoriesByGroup, (groupCategories) =>
      sumBy(
        groupCategories,
        (category) => spendCategoriesById[category.id]?.assignedAmount || 0
      )
    );

    // Calculate total for percentage calculations
    const total = spendCategoryGroups.reduce(
      (sum, group) => sum + (groupTotals[group.id] || 0),
      0
    );

    // Build outer data (category groups)
    const outerData: ChartDataItem[] = spendCategoryGroups
      .map((group, index) => {
        const value = groupTotals[group.id] || 0;
        return {
          name: group.name,
          value,
          fill: BASE_COLORS[index % BASE_COLORS.length],
          percentOfTotal: total > 0 ? (value / total) * 100 : 0,
        };
      })
      .filter((item) => item.value > 0);

    // Build inner data (categories)
    const innerData: ChartDataItem[] = [];
    spendCategoryGroups.forEach((group, groupIndex) => {
      const groupCategories = categoriesByGroup[group.id] || [];
      const baseColor = BASE_COLORS[groupIndex % BASE_COLORS.length];
      const shades = generateShades(baseColor, groupCategories.length);
      const groupTotal = groupTotals[group.id] || 0;

      groupCategories.forEach((category, catIndex) => {
        const value = spendCategoriesById[category.id]?.assignedAmount || 0;
        if (value > 0) {
          innerData.push({
            name: category.name,
            value,
            fill: shades[catIndex],
            percentOfTotal: total > 0 ? (value / total) * 100 : 0,
            percentOfGroup: groupTotal > 0 ? (value / groupTotal) * 100 : 0,
            groupName: group.name,
          });
        }
      });
    });

    return { outerData, innerData, isAnimationActive };
  }, [monthlyBudget, categoryGroups, categories, isAnimationActive]);
};

export const BudgetSummaryChart = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget, isLoading: isLoadingMonthlyBudget } =
    useMonthlyBudget(selectedMonth);
  const { outerData, innerData, isAnimationActive } = useBudgetChartData();

  if (isLoadingMonthlyBudget || !monthlyBudget) {
    return <div>Loading...</div>;
  }

  if (outerData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-content/50">
        No budgeted categories for this month
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={outerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius="60%"
            label={CustomLabel}
            labelLine={false}
            stroke="none"
            isAnimationActive={isAnimationActive}
          />
          <Pie
            data={innerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius="50%"
            innerRadius="0%"
            stroke="none"
            isAnimationActive={isAnimationActive}
          />
          <Tooltip
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload as ChartDataItem;
              const formattedValue = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(data.value / 100);

              return (
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-lg">
                  <p className="font-semibold mb-1">{data.name}</p>
                  <p className="text-sm">{formattedValue}</p>
                  {data.percentOfTotal !== undefined && (
                    <p className="text-sm text-neutral-content/70">
                      {data.percentOfTotal.toFixed(1)}% of budget
                    </p>
                  )}
                  {data.percentOfGroup !== undefined && data.groupName && (
                    <p className="text-sm text-neutral-content/70">
                      {data.percentOfGroup.toFixed(1)}% of {data.groupName}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
