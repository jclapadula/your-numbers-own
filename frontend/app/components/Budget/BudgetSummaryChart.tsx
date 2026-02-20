import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { groupBy, keyBy, mapValues, sumBy } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface ColorEntry {
  mainColor: string;
  variants: string[];
}

const COLOR_PALETTE: ColorEntry[] = [
  {
    // green ok
    mainColor: "#048966",
    variants: [
      "#048966",
      "#02523d",
      "#036e52",
      "#36a185",
      "#68b8a3",
      "#023729",
    ],
  },
  {
    //red ok
    mainColor: "#F42272",
    variants: [
      "#921444",
      "#c31b5b",
      "#f42272",
      "#f64e8e",
      "#f87aaa",
      "#fba7c7",
    ],
  },
  {
    // blue ok
    mainColor: "#00bbf9",
    variants: [
      "#004b64",
      "#007095",
      "#0096c7",
      "#33c9fa",
      "#66d6fb",
      "#99e4fd",
    ],
  },
  {
    // orange ok
    mainColor: "#f77f00",
    variants: [
      "#633300",
      "#944c00",
      "#c66600",
      "#f99933",
      "#fab266",
      "#fccc99",
    ],
  },
  {
    // orange, good
    mainColor: "#eab308",
    variants: [
      "#8c6b05",
      "#bb8f06",
      "#eec239",
      "#f2d16b",
      "#f7e19c",
      "#5e4803",
    ],
  },
  {
    // violet meh
    mainColor: "#aa4586",
    variants: ["#aa4586", "#88376b", "#bb6a9e", "#cc8fb6", "#662950"],
  },
];

interface ChartDataItem {
  id: string;
  name: string;
  value: number;
  fill: string;
  groupId?: string;
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
      "categoryId",
    );

    // Filter to only spending categories
    const spendCategories = categories.filter((cat) => !cat.isIncome);
    const spendCategoryGroups = categoryGroups
      .filter((group) => !group.isIncome)
      .sort((a, b) => a.position - b.position);

    // Group categories by groupId
    const categoriesByGroup = groupBy(
      spendCategories.sort((a, b) => a.position - b.position),
      "groupId",
    );

    // Calculate group totals
    const groupTotals = mapValues(categoriesByGroup, (groupCategories) =>
      sumBy(
        groupCategories,
        (category) => spendCategoriesById[category.id]?.assignedAmount || 0,
      ),
    );

    // Calculate total for percentage calculations
    const total = spendCategoryGroups.reduce(
      (sum, group) => sum + (groupTotals[group.id] || 0),
      0,
    );

    // Build outer data (category groups)
    const outerData: ChartDataItem[] = spendCategoryGroups
      .map((group, index) => {
        const value = groupTotals[group.id] || 0;
        const colorEntry = COLOR_PALETTE[index % COLOR_PALETTE.length];
        return {
          id: group.id,
          name: group.name,
          value,
          fill: colorEntry?.mainColor ?? "#888888",
          percentOfTotal: total > 0 ? (value / total) * 100 : 0,
        };
      })
      .filter((item) => item.value > 0);

    // Build inner data (categories)
    const innerData: ChartDataItem[] = [];
    spendCategoryGroups.forEach((group, groupIndex) => {
      const groupCategories = categoriesByGroup[group.id] || [];
      const colorEntry = COLOR_PALETTE[groupIndex % COLOR_PALETTE.length];
      const groupTotal = groupTotals[group.id] || 0;

      groupCategories.forEach((category, catIndex) => {
        const value = spendCategoriesById[category.id]?.assignedAmount || 0;
        if (value > 0) {
          const variant =
            colorEntry?.variants[
              catIndex % (colorEntry.variants.length || 1)
            ] ??
            colorEntry?.mainColor ??
            "#888888";
          innerData.push({
            id: category.id,
            name: category.name,
            value,
            fill: variant,
            groupId: group.id,
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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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

  const isGroupsView = selectedGroupId === null;
  const displayData = isGroupsView
    ? outerData
    : innerData.filter((item) => item.groupId === selectedGroupId);

  return (
    <div className="w-full">
      <div className="h-8 flex items-center">
        {!isGroupsView && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedGroupId(null)}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            See groups
          </button>
        )}
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              dataKey="value"
              cx="50%"
              cy="50%"
              label={CustomLabel}
              stroke="none"
              isAnimationActive={isAnimationActive}
              style={{ cursor: isGroupsView ? "pointer" : "default" }}
              onClick={(data: ChartDataItem) => {
                if (isGroupsView && data.id) {
                  setSelectedGroupId(data.id);
                }
              }}
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
    </div>
  );
};
