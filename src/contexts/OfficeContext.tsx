import { createContext, useContext, useState, ReactNode } from "react";
import { getSelectedOfficeId, setSelectedOfficeId } from "@/lib/officeStore";

interface OfficeContextValue {
  selectedOfficeId: string;
  setSelectedOffice: (id: string) => void;
}

const OfficeContext = createContext<OfficeContextValue>({
  selectedOfficeId: "all",
  setSelectedOffice: () => {},
});

export const OfficeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedOfficeId, setSelected] = useState<string>(getSelectedOfficeId);

  const setSelectedOffice = (id: string) => {
    setSelectedOfficeId(id);
    setSelected(id);
  };

  return (
    <OfficeContext.Provider value={{ selectedOfficeId, setSelectedOffice }}>
      {children}
    </OfficeContext.Provider>
  );
};

export const useOffice = () => useContext(OfficeContext);
