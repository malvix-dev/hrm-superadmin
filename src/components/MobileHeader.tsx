import { Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOffices } from "@/hooks/useOffices";
import { useOffice } from "@/contexts/OfficeContext";

const MobileHeader = () => {
  const { data: offices = [] } = useOffices();
  const { selectedOfficeId, setSelectedOffice } = useOffice();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border md:hidden">
      <div className="flex items-center gap-3 px-4 h-14">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-semibold text-foreground text-base">Team Manager</h1>
        <div className="ml-auto">
          <Select value={selectedOfficeId} onValueChange={setSelectedOffice}>
            <SelectTrigger className="h-8 text-xs border-border w-[130px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {offices.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
