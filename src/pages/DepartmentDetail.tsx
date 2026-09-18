import { useParams, useNavigate, Link } from "react-router-dom";
import { useDepartment } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Eye } from "lucide-react";
import { formatDate, fromSnakeCase } from "@/lib/utils";

const DepartmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dept, isLoading } = useDepartment(id!);

  if (isLoading) {
    return <div className="bg-card rounded-xl border border-border h-40 animate-pulse" />;
  }

  if (!dept) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Department not found</p>
        <Button variant="outline" onClick={() => navigate("/departments")}>Back to Departments</Button>
      </div>
    );
  }

  const employees: any[] = dept.employees || [];
  const active = employees.filter(e => e.status === "active");
  const onLeave = employees.filter(e => e.status === "on_leave");
  const terminated = employees.filter(e => e.status === "terminated");
  const totalMonthlySalary = active.reduce((sum: number, e: any) => sum + (e.salary || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/departments")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{dept.label || dept.name}</h1>
          {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Total Employees", value: employees.length, color: "text-primary" },
          { label: "Active", value: active.length, color: "text-stat-free" },
          { label: "On Leave", value: onLeave.length, color: "text-stat-pending" },
          { label: "Terminated", value: terminated.length, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Monthly Salary Budget</p>
          <p className="text-xl font-bold text-primary">₨ {totalMonthlySalary.toLocaleString()}</p>
        </div>
        {dept.headName && (
          <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Department Head</p>
            <p className="text-base font-semibold text-card-foreground">{dept.headName}</p>
          </div>
        )}
      </div>

      {employees.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Employees ({employees.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Designation</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Joining Date</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Salary</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((e: any) => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{e.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{e.designation?.label || e.designation?.title || e.dutyType || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(e.joinDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">₨ {(e.salary || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        e.status === "active" ? "bg-stat-free/15 text-stat-free" :
                        e.status === "on_leave" ? "bg-stat-pending/15 text-stat-pending" :
                        "bg-destructive/15 text-destructive"
                      }`}>
                        {e.status === "on_leave" ? "On Leave" : (e.status || "").charAt(0).toUpperCase() + (e.status || "").slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary/10" asChild>
                        <Link to={`/employees/${e.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {employees.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No employees in this department</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetail;
