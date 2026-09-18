import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { useCreateEmployee, useUpdateEmployee, useEmployee, useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useDesignations } from "@/hooks/useDesignations";
import { useOffices } from "@/hooks/useOffices";
import { useShifts } from "@/hooks/useShifts";
import { FormSelect, FormButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, ArrowLeft, Pencil } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
const CNIC_RE = /^\d{5}-\d{7}-\d{1}$/;
const PHONE_PK = /^(\+92|0)[0-9]{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Format raw digits → 99999-9999999-9 */
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const emergencyRelations = [
  "Father", "Mother", "Brother", "Sister", "Son", "Daughter", "Husband", "Wife",
  "Uncle", "Aunt", "Cousin", "Nephew", "Niece", "Grandfather", "Grandmother",
  "Father-in-Law", "Mother-in-Law", "Brother-in-Law", "Sister-in-Law",
  "Friend", "Colleague", "Neighbor", "Guardian", "Other",
];
const educationLevels = [
  "Matric (SSC)", "Intermediate (HSSC)", "Bachelor's", "Master's",
  "MPhil / MS", "PhD", "Diploma / Certificate", "Other",
];

const toOpts = (arr: string[]) => arr.map((v) => ({ label: v, value: v }));

// ── country-state-city option builders ────────────────────────────────────────
const countryOpts = () =>
  Country.getAllCountries().map((c) => ({ label: c.name, value: c.isoCode }));

const stateOpts = (countryCode: string) =>
  State.getStatesOfCountry(countryCode).map((s) => ({
    label: s.name,
    value: s.isoCode,
  }));

const cityOpts = (countryCode: string, stateCode: string) =>
  City.getCitiesOfState(countryCode, stateCode).map((c) => ({
    label: c.name,
    value: c.name,
  }));

// ── sub-components ────────────────────────────────────────────────────────────
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
    <h3 className="text-sm md:text-base font-semibold text-card-foreground mb-3 md:mb-4 pb-2 md:pb-3 border-b border-border">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {children}
    </div>
  </div>
);

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
const Field = ({ label, required, error, children, className }: FieldProps) => (
  <div className={className}>
    <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {error && (
      <p className="text-[10px] text-destructive mt-1 leading-tight">{error}</p>
    )}
  </div>
);

const FInput = ({
  label,
  required,
  error,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  error?: string;
}) => (
  <Field label={label} required={required} error={error}>
    <Input
      type={type}
      className={`h-9 text-xs md:text-sm ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      {...props}
    />
  </Field>
);

const FSelect = ({
  label,
  required,
  error,
  ...props
}: React.ComponentProps<typeof FormSelect> & {
  label: string;
  required?: boolean;
  error?: string;
}) => (
  <Field label={label} required={required} error={error}>
    <div className={error ? "[&_button]:border-destructive" : ""}>
      <FormSelect {...props} label="" />
    </div>
  </Field>
);

const FTextarea = ({
  label,
  required,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  error?: string;
}) => (
  <Field label={label} required={required} error={error}>
    <Textarea
      className={`text-xs md:text-sm resize-none ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      {...props}
    />
  </Field>
);

const PreviewRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-card-foreground text-right max-w-[60%]">
        {String(value)}
      </span>
    </div>
  );
};

const PreviewSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-3">
    <h4 className="text-xs font-semibold text-primary mb-1.5 pb-1 border-b border-primary/20">
      {title}
    </h4>
    {children}
  </div>
);

const DRAFT_KEY = "add_employee_draft";

// ── initial form state ────────────────────────────────────────────────────────
const blankForm = () => ({
  // personal
  fullName: "", fatherName: "", cnic: "", phone: "", email: "",
  dateOfBirth: "", gender: "", maritalStatus: "", address: "",
  countryCode: "PK", stateCode: "", city: "",
  // emergency
  emergencyName: "", emergencyRelation: "", emergencyPhone: "", emergencyAltPhone: "",
  // guardian
  guardianName: "", guardianCnic: "", guardianPhone: "", guardianAddress: "",
  // medical
  bloodGroup: "", medicalHistory: "",
  // education
  lastEducation: "", educationInstitute: "", educationYear: "", totalExperience: "",
  previousEmployer: "", previousDesignation: "",
  // office
  officeId: "", shiftId: "", departmentId: "", designationId: "", dutyType: "",
  reportingTo: "",
  // comp
  salary: "", joinDate: new Date().toISOString().split("T")[0],
});

const initForm = (): { form: FormState; hasDraft: boolean } => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasData = Object.values(parsed).some((v) => v !== "" && v !== "PK");
      if (hasData) return { form: { ...blankForm(), ...parsed }, hasDraft: true };
    }
  } catch {}
  return { form: blankForm(), hasDraft: false };
};

type FormState = ReturnType<typeof blankForm>;
type Errors = Partial<Record<keyof FormState, string>>;

// ── validation ────────────────────────────────────────────────────────────────
function validate(form: FormState, offices: any[]): Errors {
  const e: Errors = {};

  if (!form.fullName.trim()) e.fullName = "Full name is required";
  if (!form.fatherName.trim()) e.fatherName = "Father's name is required";

  if (!form.cnic.trim()) {
    e.cnic = "CNIC is required";
  } else if (!CNIC_RE.test(form.cnic)) {
    e.cnic = "Must be in format 99999-9999999-9";
  }

  if (!form.phone.trim()) {
    e.phone = "Phone number is required";
  } else if (!PHONE_PK.test(form.phone.replace(/\s/g, ""))) {
    e.phone = "Enter a valid Pakistani number (e.g. 03001234567 or +923001234567)";
  }

  if (!form.email.trim()) {
    e.email = "Email is required";
  } else if (!EMAIL_RE.test(form.email)) {
    e.email = "Enter a valid email address";
  }

  if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
  if (!form.gender) e.gender = "Gender is required";
  if (!form.maritalStatus) e.maritalStatus = "Marital status is required";
  if (!form.address.trim()) e.address = "Address is required";
  if (!form.countryCode) e.countryCode = "Country is required";
  if (!form.stateCode) e.stateCode = "State / Province is required";
  if (!form.city) e.city = "City is required";

  // emergency
  if (!form.emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
  if (!form.emergencyRelation) e.emergencyRelation = "Relation is required";
  if (!form.emergencyPhone.trim()) {
    e.emergencyPhone = "Emergency phone is required";
  } else if (!PHONE_PK.test(form.emergencyPhone.replace(/\s/g, ""))) {
    e.emergencyPhone = "Enter a valid Pakistani number";
  }

  // guardian
  if (!form.guardianName.trim()) e.guardianName = "Guardian name is required";
  if (!form.guardianCnic.trim()) {
    e.guardianCnic = "Guardian CNIC is required";
  } else if (!CNIC_RE.test(form.guardianCnic)) {
    e.guardianCnic = "Must be in format 99999-9999999-9";
  }
  if (!form.guardianPhone.trim()) {
    e.guardianPhone = "Guardian phone is required";
  } else if (!PHONE_PK.test(form.guardianPhone.replace(/\s/g, ""))) {
    e.guardianPhone = "Enter a valid Pakistani number";
  }
  if (!form.guardianAddress.trim()) e.guardianAddress = "Guardian address is required";

  // medical
  if (!form.bloodGroup) e.bloodGroup = "Blood group is required";

  // education (required except previous employment)
  if (!form.lastEducation) e.lastEducation = "Education level is required";
  if (!form.educationInstitute.trim()) e.educationInstitute = "Institution name is required";
  if (!form.educationYear.trim()) e.educationYear = "Passing year is required";
  if (!form.totalExperience.trim()) e.totalExperience = "Experience is required";

  // office & department
  if (!form.officeId) e.officeId = "Office branch is required";
  if (!form.departmentId) e.departmentId = "Department is required";
  if (!form.designationId) e.designationId = "Designation is required";

  // salary
  if (!form.salary || Number(form.salary) <= 0) e.salary = "Enter a valid salary";
  if (!form.joinDate) e.joinDate = "Joining date is required";

  return e;
}

// ── main component ────────────────────────────────────────────────────────────
const AddEmployee = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEditMode = !!editId;

  const { data: offices = [] } = useOffices();
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();
  const { data: allEmployees = [] } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const { data: existingEmployee, isLoading: isLoadingEmployee } = useEmployee(editId || "");

  const [form, setForm] = useState<FormState>(() => {
    if (isEditMode) return blankForm();
    const { form: f } = initForm();
    return f;
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftBanner, setDraftBanner] = useState(() => {
    if (isEditMode) return false;
    const { hasDraft } = initForm();
    return hasDraft;
  });
  const [credentialsDialog, setCredentialsDialog] = useState<{ email: string; password: string } | null>(null);
  const { data: officeShifts = [] } = useShifts(form.officeId || undefined);

  // Pre-fill form when editing existing employee
  useEffect(() => {
    if (!isEditMode || !existingEmployee) return;
    const emp = existingEmployee;
    const countryCode = emp.country
      ? (Country.getAllCountries().find((c) => c.name === emp.country)?.isoCode ?? "PK")
      : "PK";
    const stateCode = emp.state && countryCode
      ? (State.getStatesOfCountry(countryCode).find((s) => s.name === emp.state)?.isoCode ?? "")
      : "";
    setForm({
      fullName: emp.fullName ?? "",
      fatherName: emp.fatherName ?? "",
      cnic: emp.cnic ?? "",
      phone: emp.phone ?? "",
      email: emp.email ?? "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "",
      gender: emp.gender ?? "",
      maritalStatus: emp.maritalStatus ?? "",
      address: emp.address ?? "",
      countryCode,
      stateCode,
      city: emp.city ?? "",
      emergencyName: emp.emergencyName ?? "",
      emergencyRelation: emp.emergencyRelation ?? "",
      emergencyPhone: emp.emergencyPhone ?? "",
      emergencyAltPhone: emp.emergencyAltPhone ?? "",
      guardianName: emp.guardianName ?? "",
      guardianCnic: emp.guardianCnic ?? "",
      guardianPhone: emp.guardianPhone ?? "",
      guardianAddress: emp.guardianAddress ?? "",
      bloodGroup: emp.bloodGroup ?? "",
      medicalHistory: emp.medicalHistory ?? "",
      lastEducation: emp.lastEducation ?? "",
      educationInstitute: emp.educationInstitute ?? "",
      educationYear: emp.educationYear ?? "",
      totalExperience: emp.totalExperience ?? "",
      previousEmployer: emp.previousEmployer ?? "",
      previousDesignation: emp.previousDesignation ?? "",
      officeId: emp.officeId ?? "",
      shiftId: (emp as any).shiftId ?? "",
      departmentId: emp.departmentId ?? "",
      designationId: emp.designationId ?? "",
      dutyType: emp.dutyType ?? "",
      reportingTo: (emp as any).reportingTo ?? "",
      salary: String(emp.salary ?? ""),
      joinDate: emp.joinDate ? emp.joinDate.slice(0, 10) : "",
    });
  }, [existingEmployee, isEditMode]);

  // country-state-city derived lists
  const countries = countryOpts();
  const states = form.countryCode ? stateOpts(form.countryCode) : [];
  const cities = form.countryCode && form.stateCode ? cityOpts(form.countryCode, form.stateCode) : [];

  const countryName = Country.getCountryByCode(form.countryCode)?.name ?? form.countryCode;
  const stateName = form.stateCode ? State.getStateByCodeAndCountry(form.stateCode, form.countryCode)?.name ?? form.stateCode : "";

  // When shifts load for the selected office, auto-select default if no shift chosen yet
  useEffect(() => {
    if (!form.officeId || form.shiftId) return;
    const def = officeShifts.find(s => s.isDefault);
    if (def) setForm(p => ({ ...p, shiftId: def.id }));
  }, [officeShifts, form.officeId]);

  // persist draft to localStorage on every change (only in add mode)
  useEffect(() => {
    if (isEditMode) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
  }, [form, isEditMode]);

  // re-validate on change if form was already submitted once
  useEffect(() => {
    if (submitted) setErrors(validate(form, offices));
  }, [form, submitted, offices]);

  const set = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTouched((p) => ({ ...p, [key]: true }));
  };

  const handleCnic = (raw: string) => {
    set("cnic", formatCnic(raw));
  };

  const handleGuardianCnic = (raw: string) => {
    set("guardianCnic", formatCnic(raw));
  };

  const handleCountryChange = (code: string) => {
    setForm((p) => ({ ...p, countryCode: code, stateCode: "", city: "" }));
    setTouched((p) => ({ ...p, countryCode: true, stateCode: false, city: false }));
  };

  const handleStateChange = (code: string) => {
    setForm((p) => ({ ...p, stateCode: code, city: "" }));
    setTouched((p) => ({ ...p, stateCode: true, city: false }));
  };

  // show error only if field was touched or form was submitted
  const err = (key: keyof FormState) =>
    (touched[key] || submitted) ? errors[key] : undefined;

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form, offices);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted errors before proceeding");
      // scroll to first error
      setTimeout(() => {
        const el = document.querySelector("[data-error='true']");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setShowPreview(true);
  };

  const buildPayload = () => ({
    officeId: form.officeId,
    shiftId: (form.shiftId && form.shiftId !== "__none__") ? form.shiftId : undefined,
    departmentId: form.departmentId || undefined,
    designationId: form.designationId || undefined,
    fullName: form.fullName,
    fatherName: form.fatherName || undefined,
    cnic: form.cnic || undefined,
    phone: form.phone,
    email: form.email || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    gender: form.gender || undefined,
    maritalStatus: form.maritalStatus || undefined,
    address: form.address || undefined,
    city: form.city || undefined,
    state: stateName || undefined,
    country: countryName || undefined,
    emergencyName: form.emergencyName || undefined,
    emergencyRelation: form.emergencyRelation || undefined,
    emergencyPhone: form.emergencyPhone || undefined,
    emergencyAltPhone: form.emergencyAltPhone || undefined,
    guardianName: form.guardianName || undefined,
    guardianCnic: form.guardianCnic || undefined,
    guardianPhone: form.guardianPhone || undefined,
    guardianAddress: form.guardianAddress || undefined,
    bloodGroup: form.bloodGroup || undefined,
    medicalHistory: form.medicalHistory || undefined,
    lastEducation: form.lastEducation || undefined,
    educationInstitute: form.educationInstitute || undefined,
    educationYear: form.educationYear || undefined,
    totalExperience: form.totalExperience || undefined,
    previousEmployer: form.previousEmployer || undefined,
    previousDesignation: form.previousDesignation || undefined,
    dutyType: form.dutyType || undefined,
    reportingTo: form.reportingTo || undefined,
    joinDate: form.joinDate || undefined,
    salary: Number(form.salary) || 0,
  });

  const handleSave = async () => {
    try {
      if (isEditMode && editId) {
        await updateEmployee.mutateAsync({ id: editId, ...buildPayload() });
        toast.success(`${form.fullName} updated successfully`);
        navigate(`/employees/${editId}`);
      } else {
        const result = await createEmployee.mutateAsync({ ...buildPayload(), status: "active" });
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        toast.success(`${form.fullName} added successfully`);
        if ((result as any).credentials) {
          setCredentialsDialog((result as any).credentials);
        } else {
          navigate("/employees");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save employee");
    }
  };

  // helper: attach data-error for scroll-to
  const errAttr = (key: keyof FormState) =>
    err(key) ? { "data-error": "true" } : {};

  return (
    <div>
      {isEditMode && isLoadingEmployee && (
        <div className="bg-card rounded-xl border border-border h-20 animate-pulse mb-4" />
      )}

      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{isEditMode ? "Edit Employee" : "Add New Employee"}</h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          All fields marked <span className="text-destructive font-medium">*</span> are required
        </p>
      </div>

      {draftBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <span className="text-primary font-medium">Draft restored — your previous progress was saved.</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive underline shrink-0"
            onClick={() => {
              try { localStorage.removeItem(DRAFT_KEY); } catch {}
              setForm(blankForm());
              setDraftBanner(false);
            }}
          >
            Clear draft
          </button>
        </div>
      )}

      <form onSubmit={handlePreview} noValidate className="space-y-4 md:space-y-5">
        {/* ── Personal Information ── */}
        <Section title="Personal Information">
          <FInput
            label="Full Name" required
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Muhammad Ali"
            error={err("fullName")}
            {...errAttr("fullName")}
          />
          <FInput
            label="Father's Name" required
            value={form.fatherName}
            onChange={(e) => set("fatherName", e.target.value)}
            placeholder="Father's full name"
            error={err("fatherName")}
            {...errAttr("fatherName")}
          />
          <Field label="CNIC / ID Number" required error={err("cnic")} {...errAttr("cnic")}>
            <Input
              value={form.cnic}
              onChange={(e) => handleCnic(e.target.value)}
              placeholder="32202-5566677-3"
              maxLength={15}
              className={`h-9 text-xs md:text-sm font-mono tracking-widest ${err("cnic") ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </Field>
          <FInput
            label="Phone Number" required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="03001234567"
            error={err("phone")}
            {...errAttr("phone")}
          />
          <FInput
            label="Email Address" required type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="email@example.com"
            error={err("email")}
            {...errAttr("email")}
          />
          <FInput
            label="Date of Birth" required type="date"
            value={form.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            error={err("dateOfBirth")}
            {...errAttr("dateOfBirth")}
          />
          <FSelect
            label="Gender" required
            value={form.gender} onValueChange={(v) => set("gender", v)}
            options={toOpts(genders)} placeholder="Select gender"
            error={err("gender")}
            {...errAttr("gender")}
          />
          <FSelect
            label="Marital Status" required
            value={form.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}
            options={toOpts(maritalStatuses)} placeholder="Select status"
            error={err("maritalStatus")}
            {...errAttr("maritalStatus")}
          />
          <FInput
            label="Permanent Address" required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="House no, street, area"
            error={err("address")}
            {...errAttr("address")}
          />
          <FSelect
            label="Country" required searchable
            value={form.countryCode} onValueChange={handleCountryChange}
            options={countries} placeholder="Select country"
            error={err("countryCode")}
            {...errAttr("countryCode")}
          />
          <FSelect
            label="State / Province" required searchable
            value={form.stateCode} onValueChange={handleStateChange}
            options={states} placeholder={form.countryCode ? "Select state" : "Select country first"}
            error={err("stateCode")}
            {...errAttr("stateCode")}
          />
          <FSelect
            label="City" required searchable
            value={form.city} onValueChange={(v) => set("city", v)}
            options={cities} placeholder={form.stateCode ? "Select city" : "Select state first"}
            error={err("city")}
            {...errAttr("city")}
          />
        </Section>

        {/* ── Emergency Contact ── */}
        <Section title="Emergency Contact">
          <FInput
            label="Contact Name" required
            value={form.emergencyName}
            onChange={(e) => set("emergencyName", e.target.value)}
            placeholder="Emergency contact full name"
            error={err("emergencyName")}
            {...errAttr("emergencyName")}
          />
          <FSelect
            label="Relation" required searchable
            value={form.emergencyRelation} onValueChange={(v) => set("emergencyRelation", v)}
            options={toOpts(emergencyRelations)} placeholder="Select relation"
            error={err("emergencyRelation")}
            {...errAttr("emergencyRelation")}
          />
          <FInput
            label="Phone Number" required
            value={form.emergencyPhone}
            onChange={(e) => set("emergencyPhone", e.target.value)}
            placeholder="03001234567"
            error={err("emergencyPhone")}
            {...errAttr("emergencyPhone")}
          />
          <FInput
            label="Alternate Number"
            value={form.emergencyAltPhone}
            onChange={(e) => set("emergencyAltPhone", e.target.value)}
            placeholder="03001234567 (optional)"
          />
        </Section>

        {/* ── Guardian Information ── */}
        <Section title="Guardian Information">
          <FInput
            label="Guardian Name" required
            value={form.guardianName}
            onChange={(e) => set("guardianName", e.target.value)}
            placeholder="Guardian's full name"
            error={err("guardianName")}
            {...errAttr("guardianName")}
          />
          <Field label="Guardian CNIC" required error={err("guardianCnic")} {...errAttr("guardianCnic")}>
            <Input
              value={form.guardianCnic}
              onChange={(e) => handleGuardianCnic(e.target.value)}
              placeholder="32202-5566677-3"
              maxLength={15}
              className={`h-9 text-xs md:text-sm font-mono tracking-widest ${err("guardianCnic") ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </Field>
          <FInput
            label="Guardian Phone" required
            value={form.guardianPhone}
            onChange={(e) => set("guardianPhone", e.target.value)}
            placeholder="03001234567"
            error={err("guardianPhone")}
            {...errAttr("guardianPhone")}
          />
          <Field
            label="Guardian Address" required
            error={err("guardianAddress")}
            className="md:col-span-2 lg:col-span-3"
            {...errAttr("guardianAddress")}
          >
            <Input
              value={form.guardianAddress}
              onChange={(e) => set("guardianAddress", e.target.value)}
              placeholder="Guardian's complete address"
              className={`h-9 text-xs md:text-sm ${err("guardianAddress") ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </Field>
        </Section>

        {/* ── Medical Information ── */}
        <Section title="Medical Information">
          <FSelect
            label="Blood Group" required
            value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}
            options={toOpts(bloodGroups)} placeholder="Select blood group"
            error={err("bloodGroup")}
            {...errAttr("bloodGroup")}
          />
          <Field label="Medical History" className="md:col-span-2 lg:col-span-2">
            <FTextarea
              label=""
              value={form.medicalHistory}
              onChange={(e) => set("medicalHistory", e.target.value)}
              placeholder="Any existing medical conditions or allergies (optional)"
              rows={2}
            />
          </Field>
        </Section>

        {/* ── Education & Experience ── */}
        <Section title="Education & Experience">
          <FSelect
            label="Last Education" required
            value={form.lastEducation} onValueChange={(v) => set("lastEducation", v)}
            options={toOpts(educationLevels)} placeholder="Select education level"
            error={err("lastEducation")}
            {...errAttr("lastEducation")}
          />
          <FInput
            label="Institution / University" required
            value={form.educationInstitute}
            onChange={(e) => set("educationInstitute", e.target.value)}
            placeholder="Name of school/university"
            error={err("educationInstitute")}
            {...errAttr("educationInstitute")}
          />
          <FInput
            label="Passing Year" required type="number"
            value={form.educationYear}
            onChange={(e) => set("educationYear", e.target.value)}
            placeholder="e.g. 2020"
            error={err("educationYear")}
            {...errAttr("educationYear")}
          />
          <FInput
            label="Total Experience" required
            value={form.totalExperience}
            onChange={(e) => set("totalExperience", e.target.value)}
            placeholder="e.g. 3 years"
            error={err("totalExperience")}
            {...errAttr("totalExperience")}
          />
          {/* Previous employment — NOT required */}
          <FInput
            label="Previous Employer"
            value={form.previousEmployer}
            onChange={(e) => set("previousEmployer", e.target.value)}
            placeholder="Company / organization name (optional)"
          />
          <FInput
            label="Previous Designation"
            value={form.previousDesignation}
            onChange={(e) => set("previousDesignation", e.target.value)}
            placeholder="Job title at previous employer (optional)"
          />
        </Section>

        {/* ── Office & Department ── */}
        <Section title="Office & Department">
          <FSelect
            label="Office Branch" required searchable
            value={form.officeId}
            onValueChange={(v) => {
              // auto-select default shift for this office, clear otherwise
              const defaultShift = officeShifts.find(s => s.officeId === v && s.isDefault);
              setForm(p => ({ ...p, officeId: v, shiftId: defaultShift?.id ?? "" }));
              setTouched(p => ({ ...p, officeId: true }));
            }}
            options={offices.map((o) => ({ label: `${o.name} — ${o.city}`, value: o.id }))}
            placeholder="Select office branch"
            error={err("officeId")}
            {...errAttr("officeId")}
          />
          <FSelect
            label="Shift"
            value={form.shiftId}
            onValueChange={(v) => set("shiftId", v)}
            options={[
              { label: "No shift assigned", value: "__none__" },
              ...officeShifts.map(s => ({
                label: `${s.name} (${s.startTime}–${s.endTime})${s.isDefault ? " · Default" : ""}`,
                value: s.id,
              })),
            ]}
            placeholder={form.officeId ? (officeShifts.length === 0 ? "No shifts for this branch" : "Select shift") : "Select office first"}
            disabled={!form.officeId || officeShifts.length === 0}
          />
          <FSelect
            label="Department" required searchable
            value={form.departmentId} onValueChange={(v) => set("departmentId", v)}
            options={departments.map((d) => ({ label: d.label || d.name, value: d.id }))}
            placeholder="Select department"
            error={err("departmentId")}
            {...errAttr("departmentId")}
          />
          <FSelect
            label="Hiring Designation" required searchable
            value={form.designationId}
            onValueChange={(v) => {
              set("designationId", v);
              const d = designations.find((x) => x.id === v);
              if (d) setForm((p) => ({ ...p, designationId: v, dutyType: d.label || d.title }));
            }}
            options={designations.map((d) => ({ label: d.label || d.title, value: d.id }))}
            placeholder="Select designation"
            error={err("designationId")}
            {...errAttr("designationId")}
          />
          <FSelect
            label="Reporting Person" searchable
            value={form.reportingTo}
            onValueChange={(v) => set("reportingTo", v)}
            options={allEmployees
              .filter((e) => e.id !== editId)
              .map((e) => ({ label: e.fullName, value: e.id }))}
            placeholder="Select reporting manager"
          />
        </Section>

        {/* ── Compensation ── */}
        <Section title="Compensation">
          <FInput
            label="Monthly Salary (₨)" required type="number"
            value={form.salary}
            onChange={(e) => set("salary", e.target.value)}
            placeholder="e.g. 25000"
            error={err("salary")}
            {...errAttr("salary")}
          />
          <FInput
            label="Joining Date" required type="date"
            value={form.joinDate}
            onChange={(e) => set("joinDate", e.target.value)}
            error={err("joinDate")}
            {...errAttr("joinDate")}
          />
        </Section>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          <FormButton
            type="button"
            variant="outline"
            onClick={() => {
              if (!isEditMode) { try { localStorage.removeItem(DRAFT_KEY); } catch {} }
              navigate(isEditMode ? `/employees/${editId}/detail` : "/employees");
            }}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cancel
          </FormButton>
          <FormButton type="submit" className="w-full sm:w-auto">
            <Eye className="w-3.5 h-3.5 mr-1" /> {isEditMode ? "Preview & Update" : "Preview & Save"}
          </FormButton>
        </div>
      </form>

      {/* ── Preview Dialog ── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Employee Preview</DialogTitle>
          </DialogHeader>

          <PreviewSection title="Personal Information">
            <PreviewRow label="Full Name" value={form.fullName} />
            <PreviewRow label="Father's Name" value={form.fatherName} />
            <PreviewRow label="CNIC" value={form.cnic} />
            <PreviewRow label="Phone" value={form.phone} />
            <PreviewRow label="Email" value={form.email} />
            <PreviewRow label="Date of Birth" value={form.dateOfBirth} />
            <PreviewRow label="Gender" value={form.gender} />
            <PreviewRow label="Marital Status" value={form.maritalStatus} />
            <PreviewRow label="Address" value={form.address} />
            <PreviewRow label="City" value={form.city} />
            <PreviewRow label="State" value={stateName} />
            <PreviewRow label="Country" value={countryName} />
          </PreviewSection>

          <PreviewSection title="Emergency Contact">
            <PreviewRow label="Name" value={form.emergencyName} />
            <PreviewRow label="Relation" value={form.emergencyRelation} />
            <PreviewRow label="Phone" value={form.emergencyPhone} />
            <PreviewRow label="Alt Phone" value={form.emergencyAltPhone} />
          </PreviewSection>

          <PreviewSection title="Guardian">
            <PreviewRow label="Name" value={form.guardianName} />
            <PreviewRow label="CNIC" value={form.guardianCnic} />
            <PreviewRow label="Phone" value={form.guardianPhone} />
            <PreviewRow label="Address" value={form.guardianAddress} />
          </PreviewSection>

          <PreviewSection title="Medical">
            <PreviewRow label="Blood Group" value={form.bloodGroup} />
            <PreviewRow label="Medical History" value={form.medicalHistory} />
          </PreviewSection>

          <PreviewSection title="Education & Experience">
            <PreviewRow label="Last Education" value={form.lastEducation} />
            <PreviewRow label="Institution" value={form.educationInstitute} />
            <PreviewRow label="Passing Year" value={form.educationYear} />
            <PreviewRow label="Total Experience" value={form.totalExperience} />
            <PreviewRow label="Previous Employer" value={form.previousEmployer} />
            <PreviewRow label="Previous Designation" value={form.previousDesignation} />
          </PreviewSection>

          <PreviewSection title="Office & Role">
            <PreviewRow label="Office Branch" value={offices.find((o) => o.id === form.officeId)?.name ?? ""} />
            <PreviewRow label="Department" value={(() => { const d = departments.find((d) => d.id === form.departmentId); return d ? (d.label || d.name) : ""; })()} />
            <PreviewRow label="Designation" value={(() => { const d = designations.find((d) => d.id === form.designationId); return d ? (d.label || d.title) : form.dutyType; })()} />
            <PreviewRow label="Reporting Person" value={allEmployees.find((e) => e.id === form.reportingTo)?.fullName ?? ""} />
            <PreviewRow label="Salary" value={`₨ ${Number(form.salary).toLocaleString()}`} />
            <PreviewRow label="Joining Date" value={form.joinDate} />
          </PreviewSection>

          <div className="flex gap-2 pt-3 border-t border-border">
            <FormButton
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowPreview(false)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </FormButton>
            <FormButton
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={createEmployee.isPending || updateEmployee.isPending}
            >
              {(createEmployee.isPending || updateEmployee.isPending) ? "Saving..." : isEditMode ? "Update Employee" : "Save Employee"}
            </FormButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials dialog shown after employee creation */}
      <Dialog open={!!credentialsDialog} onOpenChange={(open) => { if (!open) { setCredentialsDialog(null); navigate("/employees"); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mobile App Login Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Share these credentials with the employee. They will use them to log into the mobile app.</p>
            <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold select-all">{credentialsDialog?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-semibold select-all">{credentialsDialog?.password}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Password is the employee's CNIC. They can change it after first login.</p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={() => { setCredentialsDialog(null); navigate("/employees"); }}
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AddEmployee;
