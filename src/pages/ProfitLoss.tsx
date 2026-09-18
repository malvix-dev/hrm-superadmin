import { useState, useMemo } from "react";
import { useAllExpenses } from "@/hooks/useExpenses";
import { useOffice } from "@/contexts/OfficeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingDown, Banknote, Receipt, Tag } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PALETTE = [
  "#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899",
  "#8b5cf6","#14b8a6","#f97316","#84cc16","#06b6d4","#a855f7",
];

const fmt = (n: number) => `₨ ${n.toLocaleString()}`;

const ExpenseReport = () => {
  const { selectedOfficeId } = useOffice();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  const { data: allExpenses = [], isLoading } = useAllExpenses({ officeId: selectedOfficeId });

  // ── monthly data ─────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const year = parseInt(selectedYear);
    return MONTHS.map((month, idx) => {
      const monthStr = `${year}-${String(idx + 1).padStart(2, "0")}`;
      const salary = allExpenses
        .filter(e => e.date.startsWith(monthStr) && e.type === "Salary")
        .reduce((s, e) => s + e.amount, 0);
      const other = allExpenses
        .filter(e => e.date.startsWith(monthStr) && e.type !== "Salary")
        .reduce((s, e) => s + e.amount, 0);
      return { month, monthStr, salary, other, total: salary + other };
    });
  }, [selectedYear, allExpenses]);

  // ── category breakdown ────────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const year = parseInt(selectedYear);
    const map: Record<string, { amount: number; count: number }> = {};
    allExpenses
      .filter(e => e.date.startsWith(String(year)))
      .forEach(e => {
        const key = e.type || "Uncategorized";
        if (!map[key]) map[key] = { amount: 0, count: 0 };
        map[key].amount += e.amount;
        map[key].count += 1;
      });
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0);
    return Object.entries(map)
      .map(([name, v]) => ({ name, amount: v.amount, count: v.count, pct: total > 0 ? (v.amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedYear, allExpenses]);

  // ── totals ───────────────────────────────────────────────────────────────────
  const totals = useMemo(() => monthlyData.reduce(
    (acc, d) => ({ salary: acc.salary + d.salary, other: acc.other + d.other, total: acc.total + d.total }),
    { salary: 0, other: 0, total: 0 }
  ), [monthlyData]);

  const topCategory = categoryData.find(c => c.name !== "Salary") ?? categoryData[0];

  const pieData = [
    { name: "Salaries", value: totals.salary },
    { name: "Other Expenses", value: totals.other },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-card rounded animate-pulse w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Expense Report</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Spending breakdown by category and month</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28 md:w-32 h-9 md:h-10 text-xs md:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Total Expenses", value: fmt(totals.total), icon: TrendingDown, color: "text-destructive" },
          { label: "Salaries", value: fmt(totals.salary), icon: Banknote, color: "text-primary" },
          { label: "Other Expenses", value: fmt(totals.other), icon: Receipt, color: "text-stat-pending" },
          { label: "Top Category", value: topCategory?.name ?? "—", sub: topCategory ? fmt(topCategory.amount) : "", icon: Tag, color: "text-stat-free" },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <c.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${c.color}`} />
                <span className="text-[10px] md:text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className={`text-sm md:text-lg font-bold ${c.color} truncate`}>{c.value}</p>
              {c.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Monthly trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-3 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-sm md:text-base">Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => fmt(v)}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="salary" stackId="a" fill="hsl(var(--primary))" name="Salary" />
                <Bar dataKey="other" stackId="a" fill="hsl(var(--stat-pending))" name="Other" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary vs Other pie */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-sm md:text-base">Salary vs Other</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center px-2 md:px-4">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">No data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={["hsl(var(--primary))","hsl(var(--stat-pending))"][i]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => fmt(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 w-full mt-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ["hsl(var(--primary))","hsl(var(--stat-pending))"][i] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium">{totals.total > 0 ? `${((d.value/totals.total)*100).toFixed(1)}%` : "0%"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Horizontal bar chart */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-sm md:text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-4">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No expenses recorded</p>
            ) : (
              <div className="space-y-2.5 mt-1">
                {categoryData.slice(0, 8).map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-xs text-card-foreground font-medium truncate max-w-[140px]">{cat.name}</span>
                        <span className="text-[10px] text-muted-foreground">({cat.count})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold">{fmt(cat.amount)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{cat.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${cat.pct}%`, background: PALETTE[i % PALETTE.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category table */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-sm md:text-base">Category Details — {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs px-3 md:px-4">Category</TableHead>
                    <TableHead className="text-xs px-3 md:px-4 text-center">Txns</TableHead>
                    <TableHead className="text-xs px-3 md:px-4 text-right">Amount</TableHead>
                    <TableHead className="text-xs px-3 md:px-4 text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No data</TableCell></TableRow>
                  ) : categoryData.map((cat, i) => (
                    <TableRow key={cat.name}>
                      <TableCell className="text-xs px-3 md:px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                          {cat.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs px-3 md:px-4 text-center text-muted-foreground">{cat.count}</TableCell>
                      <TableCell className="text-xs px-3 md:px-4 text-right font-medium">{fmt(cat.amount)}</TableCell>
                      <TableCell className="text-xs px-3 md:px-4 text-right text-muted-foreground">{cat.pct.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseReport;
