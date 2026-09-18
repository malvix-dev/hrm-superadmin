// Comprehensive seed — version key bumped to force re-seed
const SEED_KEY = "tm_seeded_v4";

// ── helpers ──────────────────────────────────────────────────────────────────
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function workingDays(count: number): string[] {
  const days: string[] = [];
  const d = new Date("2026-09-13");
  while (days.length < count) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ── offices ──────────────────────────────────────────────────────────────────
const OFFICES = [
  { id: "off-1", name: "TechCorp Karachi",   location: "Karachi",   address: "Plot 15, Shahrah-e-Faisal", city: "Karachi",   state: "Sindh",  country: "Pakistan", phone: "021-34556677", email: "karachi@techcorp.pk",   managerName: "Ahmad Raza",   managerId: "staff-bm-1", status: "active", createdAt: "2024-01-01T00:00:00Z" },
  { id: "off-2", name: "TechCorp Lahore",    location: "Lahore",    address: "Office 5, Gulberg III",     city: "Lahore",    state: "Punjab", country: "Pakistan", phone: "042-35661234", email: "lahore@techcorp.pk",    managerName: "Imran Shah",   managerId: "staff-bm-2", status: "active", createdAt: "2024-03-01T00:00:00Z" },
  { id: "off-3", name: "TechCorp Islamabad", location: "Islamabad", address: "Suite 7, Blue Area",        city: "Islamabad", state: "ICT",    country: "Pakistan", phone: "051-2892233",  email: "islamabad@techcorp.pk", managerName: "Naveed Ahmad", managerId: "staff-bm-3", status: "active", createdAt: "2024-06-01T00:00:00Z" },
];

// ── staff accounts ────────────────────────────────────────────────────────────
const STAFF = [
  { id: "staff-sa-1", name: "Super Admin",    email: "admin@techcorp.com",              password: "admin123",   role: "super_admin",     branchId: "all",   createdAt: "2024-01-01T00:00:00Z" },
  { id: "staff-bm-1", name: "Ahmad Raza",     email: "manager.karachi@techcorp.com",    password: "branch123",  role: "branch_manager",  branchId: "off-1", createdAt: "2024-01-01T00:00:00Z" },
  { id: "staff-bm-2", name: "Imran Shah",     email: "manager.lahore@techcorp.com",     password: "branch123",  role: "branch_manager",  branchId: "off-2", createdAt: "2024-03-01T00:00:00Z" },
  { id: "staff-bm-3", name: "Naveed Ahmad",   email: "manager.islamabad@techcorp.com",  password: "branch123",  role: "branch_manager",  branchId: "off-3", createdAt: "2024-06-01T00:00:00Z" },
  { id: "staff-fm-1", name: "Waqar Abbas",    email: "finance.karachi@techcorp.com",    password: "finance123", role: "finance_manager", branchId: "off-1", createdAt: "2024-01-15T00:00:00Z" },
  { id: "staff-fm-2", name: "Nadia Hussain",  email: "finance.lahore@techcorp.com",     password: "finance123", role: "finance_manager", branchId: "off-2", createdAt: "2024-03-15T00:00:00Z" },
  { id: "staff-fm-3", name: "Hira Fatima",    email: "finance.islamabad@techcorp.com",  password: "finance123", role: "finance_manager", branchId: "off-3", createdAt: "2024-06-15T00:00:00Z" },
];

// ── departments ──────────────────────────────────────────────────────────────
// heads filled after employees array
const DEPARTMENTS = [
  { id: "dept-1", name: "Engineering",         description: "Software development and infrastructure",   headName: "Sana Iqbal",   headEmployeeId: "emp-k02", createdAt: "2024-01-15T00:00:00Z" },
  { id: "dept-2", name: "Sales & Marketing",   description: "Revenue generation and brand management",  headName: "Nadia Hussain", headEmployeeId: "emp-k06", createdAt: "2024-01-15T00:00:00Z" },
  { id: "dept-3", name: "Human Resources",     description: "Talent acquisition and employee wellbeing",headName: "Hira Fatima",   headEmployeeId: "emp-k08", createdAt: "2024-01-15T00:00:00Z" },
  { id: "dept-4", name: "Finance",             description: "Accounting, payroll and financial control", headName: "Waqar Abbas",   headEmployeeId: "emp-k10", createdAt: "2024-01-15T00:00:00Z" },
  { id: "dept-5", name: "Operations",          description: "Day-to-day business operations",            headName: "Imran Shah",    headEmployeeId: "emp-l01", createdAt: "2024-01-15T00:00:00Z" },
  { id: "dept-6", name: "Customer Support",    description: "Client relations and post-sales support",  headName: "Rabia Noor",    headEmployeeId: "emp-k13", createdAt: "2024-01-15T00:00:00Z" },
];

// ── designations ─────────────────────────────────────────────────────────────
const DESIGNATIONS = [
  { id: "d-1",  title: "CEO",                      department: "",                  description: "Chief Executive Officer",              createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-2",  title: "COO",                      department: "Operations",        description: "Chief Operating Officer",              createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-3",  title: "CTO",                      department: "Engineering",       description: "Chief Technology Officer",             createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-4",  title: "CFO",                      department: "Finance",           description: "Chief Financial Officer",              createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-5",  title: "Senior Software Engineer", department: "Engineering",       description: "Senior member of engineering team",    createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-6",  title: "Software Engineer",        department: "Engineering",       description: "Core software development role",       createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-7",  title: "Junior Developer",         department: "Engineering",       description: "Entry-level development role",         createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-8",  title: "DevOps Engineer",          department: "Engineering",       description: "CI/CD and infrastructure management",  createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-9",  title: "QA Engineer",              department: "Engineering",       description: "Quality assurance and testing",        createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-10", title: "Sales Manager",            department: "Sales & Marketing", description: "Leads the sales team",                 createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-11", title: "Sales Executive",          department: "Sales & Marketing", description: "Front-line sales representative",      createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-12", title: "Marketing Manager",        department: "Sales & Marketing", description: "Marketing strategy and campaigns",     createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-13", title: "HR Manager",               department: "Human Resources",  description: "HR department head",                   createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-14", title: "HR Executive",             department: "Human Resources",  description: "Recruits and manages HR tasks",        createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-15", title: "Finance Manager",          department: "Finance",           description: "Oversees financial operations",        createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-16", title: "Accountant",               department: "Finance",           description: "Handles accounts and payroll",         createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-17", title: "Operations Manager",       department: "Operations",        description: "Manages operational workflows",        createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-18", title: "Operations Supervisor",    department: "Operations",        description: "Field operations supervision",         createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-19", title: "Customer Support Lead",    department: "Customer Support",  description: "Leads the support team",               createdAt: "2024-01-01T00:00:00Z" },
  { id: "d-20", title: "Support Executive",        department: "Customer Support",  description: "Handles customer queries and tickets", createdAt: "2024-01-01T00:00:00Z" },
];

// ── leave types ──────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { id: "lt-1", name: "Annual Leave",    description: "Yearly paid leave entitlement",    maxDaysPerYear: "20", isPaid: true,  color: "#10b981", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-2", name: "Sick Leave",      description: "Medical / health-related absence", maxDaysPerYear: "10", isPaid: true,  color: "#f59e0b", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-3", name: "Casual Leave",    description: "Short-notice personal leave",      maxDaysPerYear: "12", isPaid: true,  color: "#6366f1", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-4", name: "Emergency Leave", description: "Unforeseen urgent situations",     maxDaysPerYear: "5",  isPaid: true,  color: "#ef4444", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-5", name: "Unpaid Leave",    description: "Leave without salary",             maxDaysPerYear: "",   isPaid: false, color: "#94a3b8", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-6", name: "Maternity Leave", description: "Leave for new mothers",            maxDaysPerYear: "90", isPaid: true,  color: "#ec4899", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-7", name: "Paternity Leave", description: "Leave for new fathers",            maxDaysPerYear: "10", isPaid: true,  color: "#3b82f6", createdAt: "2024-01-01T00:00:00Z" },
  { id: "lt-8", name: "Study Leave",     description: "Leave for educational purposes",   maxDaysPerYear: "10", isPaid: false, color: "#8b5cf6", createdAt: "2024-01-01T00:00:00Z" },
];

// ── employees ────────────────────────────────────────────────────────────────
function emp(
  id: string, officeId: string, dept: string, fullName: string, fatherName: string,
  cnic: string, phone: string, email: string, dob: string, gender: string,
  city: string, state: string, desig: string, salary: number,
  joining: string, status: "active" | "on-leave" | "terminated",
  totalLeaves: number, leavesTaken: number,
) {
  return {
    id, officeId, department: dept, fullName, fatherName, cnic, phone, email,
    dateOfBirth: dob, gender,
    address: `House ${hash(id) % 90 + 10}, Street ${hash(id + "s") % 15 + 1}`,
    city, state, country: "Pakistan",
    emergencyName: fatherName, emergencyRelation: "Father",
    emergencyPhone: "0300-" + String(hash(id + "ep") % 10000000).padStart(7, "0"),
    emergencyAltPhone: "",
    guardianName: fatherName, guardianCnic: cnic.replace(/-\d+$/, "-2"),
    guardianPhone: "0300-" + String(hash(id + "gp") % 10000000).padStart(7, "0"),
    guardianAddress: `House ${hash(id) % 90 + 10}, ${city}`,
    bloodGroup: ["A+","B+","O+","AB+","A-","B-","O-","AB-"][hash(id) % 8],
    medicalConditions: "None", allergies: "None",
    selfImage: "", idCardFront: "", idCardBack: "", policeCharacterCert: "",
    maritalStatus: hash(id) % 3 === 0 ? "Married" : "Single",
    lastEducation: ["Bachelor's","Master's","BS","MS","MBA"][hash(id) % 5],
    educationInstitute: ["LUMS","NUST","FAST","IBA","UET","COMSATS","QAU"][hash(id) % 7],
    educationYear: String(2015 + hash(id) % 8),
    totalExperience: String(hash(id) % 10 + 1) + " years",
    previousEmployer: ["TechSol Pvt Ltd","DataSystems","WebCore","SoftPro","NetTech"][hash(id) % 5],
    previousDesignation: desig,
    hiringDesignation: desig, dutyType: desig, salary,
    totalLeaves, leavesTaken, joiningDate: joining, status, createdAt: joining + "T08:00:00Z",
  };
}

const EMPLOYEES = [
  // ── Karachi (off-1) ───────────────────────────────────────────────────────
  emp("emp-k01","off-1","Engineering",      "Ahmad Raza",       "Raza Ahmad",      "42101-1111111-1","0300-1010101","ahmad.raza@techcorp.pk",    "1978-03-15","Male",  "Karachi","Sindh",   "CEO",                     150000,"2020-01-01","active",30,3),
  emp("emp-k02","off-1","Engineering",      "Sana Iqbal",       "Iqbal Hussain",   "42102-2222222-2","0301-2020202","sana.iqbal@techcorp.pk",     "1985-07-20","Female","Karachi","Sindh",   "CTO",                     130000,"2020-02-01","active",25,2),
  emp("emp-k03","off-1","Engineering",      "Usman Khan",       "Khan Muhammad",   "42103-3333333-3","0302-3030303","usman.khan@techcorp.pk",     "1990-04-11","Male",  "Karachi","Sindh",   "Senior Software Engineer", 90000,"2021-03-15","active",20,5),
  emp("emp-k04","off-1","Engineering",      "Zara Ali",         "Ali Hassan",      "42104-4444444-4","0303-4040404","zara.ali@techcorp.pk",       "1993-09-25","Female","Karachi","Sindh",   "Software Engineer",        65000,"2022-01-10","active",15,1),
  emp("emp-k05","off-1","Engineering",      "Kamran Malik",     "Malik Nawaz",     "42105-5555555-5","0304-5050505","kamran.malik@techcorp.pk",   "1994-12-05","Male",  "Karachi","Sindh",   "Software Engineer",        62000,"2022-06-01","active",15,3),
  emp("emp-k06","off-1","Sales & Marketing","Nadia Hussain",    "Hussain Jamil",   "42106-6666666-6","0305-6060606","nadia.hussain@techcorp.pk",  "1988-02-14","Female","Karachi","Sindh",   "Sales Manager",            75000,"2021-01-15","active",20,4),
  emp("emp-k07","off-1","Sales & Marketing","Bilal Ahmed",      "Ahmed Farhan",    "42107-7777777-7","0306-7070707","bilal.ahmed@techcorp.pk",    "1995-06-30","Male",  "Karachi","Sindh",   "Sales Executive",          45000,"2023-04-01","active",15,2),
  emp("emp-k08","off-1","Human Resources",  "Hira Fatima",      "Fatima Akram",    "42108-8888888-8","0307-8080808","hira.fatima@techcorp.pk",    "1987-11-08","Female","Karachi","Sindh",   "HR Manager",               70000,"2021-06-01","active",20,1),
  emp("emp-k09","off-1","Human Resources",  "Danish Mehmood",   "Mehmood Sajid",   "42109-9999999-9","0308-9090909","danish.m@techcorp.pk",       "1996-03-22","Male",  "Karachi","Sindh",   "HR Executive",             45000,"2023-01-10","active",15,0),
  emp("emp-k10","off-1","Finance",          "Waqar Abbas",      "Abbas Tariq",     "42110-1010101-1","0309-1011011","waqar.abbas@techcorp.pk",    "1984-08-17","Male",  "Karachi","Sindh",   "Finance Manager",          80000,"2021-01-01","active",20,2),
  emp("emp-k11","off-1","Finance",          "Maryam Siddiqui",  "Siddiqui Waheed", "42111-2121212-2","0310-2122122","maryam.s@techcorp.pk",       "1991-05-03","Female","Karachi","Sindh",   "Accountant",               55000,"2022-03-01","active",15,1),
  emp("emp-k12","off-1","Operations",       "Asif Bhatti",      "Bhatti Zahoor",   "42112-3232323-3","0311-3233233","asif.bhatti@techcorp.pk",    "1986-10-19","Male",  "Karachi","Sindh",   "Operations Manager",       72000,"2021-09-01","active",20,3),
  emp("emp-k13","off-1","Customer Support", "Rabia Noor",       "Noor Bashir",     "42113-4343434-4","0312-4344344","rabia.noor@techcorp.pk",     "1992-01-27","Female","Karachi","Sindh",   "Customer Support Lead",    50000,"2022-08-01","active",15,2),
  emp("emp-k14","off-1","Customer Support", "Faisal Khalid",    "Khalid Pervaiz",  "42114-5454545-5","0313-5455455","faisal.k@techcorp.pk",       "1997-07-15","Male",  "Karachi","Sindh",   "Support Executive",        38000,"2023-07-01","active",12,1),

  // ── Lahore (off-2) ────────────────────────────────────────────────────────
  emp("emp-l01","off-2","Operations",       "Imran Shah",       "Shah Nawaz",      "35201-1111111-1","0314-1011011","imran.shah@techcorp.pk",     "1980-04-10","Male",  "Lahore","Punjab",  "COO",                     140000,"2020-03-01","active",30,4),
  emp("emp-l02","off-2","Engineering",      "Ayesha Butt",      "Butt Zafar",      "35202-2222222-2","0315-2122122","ayesha.butt@techcorp.pk",    "1988-09-14","Female","Lahore","Punjab",  "Senior Software Engineer", 88000,"2021-07-01","active",20,2),
  emp("emp-l03","off-2","Engineering",      "Shahid Nawaz",     "Nawaz Iqbal",     "35203-3333333-3","0316-3233233","shahid.n@techcorp.pk",       "1992-11-02","Male",  "Lahore","Punjab",  "Software Engineer",        63000,"2022-05-15","active",15,0),
  emp("emp-l04","off-2","Engineering",      "Sadia Anwar",      "Anwar Riaz",      "35204-4444444-4","0317-4344344","sadia.a@techcorp.pk",        "1998-02-18","Female","Lahore","Punjab",  "Junior Developer",         45000,"2023-09-01","active",12,1),
  emp("emp-l05","off-2","Engineering",      "Tariq Javed",      "Javed Asghar",    "35205-5555555-5","0318-5455455","tariq.j@techcorp.pk",        "1993-06-25","Male",  "Lahore","Punjab",  "QA Engineer",              55000,"2022-11-01","active",15,2),
  emp("emp-l06","off-2","Sales & Marketing","Munira Saleem",    "Saleem Rashid",   "35206-6666666-6","0319-6566566","munira.s@techcorp.pk",       "1987-12-07","Female","Lahore","Punjab",  "Sales Manager",            73000,"2021-04-01","active",20,3),
  emp("emp-l07","off-2","Sales & Marketing","Hamid Rajput",     "Rajput Sultan",   "35207-7777777-7","0320-7677677","hamid.r@techcorp.pk",        "1995-03-19","Male",  "Lahore","Punjab",  "Sales Executive",          43000,"2023-02-01","active",12,1),
  emp("emp-l08","off-2","Sales & Marketing","Rubina Parveen",   "Parveen Yousuf",  "35208-8888888-8","0321-8788788","rubina.p@techcorp.pk",       "1994-08-11","Female","Lahore","Punjab",  "Sales Executive",          42000,"2023-03-15","active",12,0),
  emp("emp-l09","off-2","Human Resources",  "Nasir Ahmed",      "Ahmed Ghafoor",   "35209-9999999-9","0322-9899899","nasir.a@techcorp.pk",        "1990-01-30","Male",  "Lahore","Punjab",  "HR Executive",             44000,"2023-01-01","active",12,2),
  emp("emp-l10","off-2","Finance",          "Lubna Qureshi",    "Qureshi Aslam",   "35210-1010101-1","0323-1011011","lubna.q@techcorp.pk",        "1989-05-22","Female","Lahore","Punjab",  "Accountant",               54000,"2022-07-01","active",15,1),
  emp("emp-l11","off-2","Operations",       "Adnan Malik",      "Malik Bashir",    "35211-2121212-2","0324-2122122","adnan.m@techcorp.pk",        "1991-10-04","Male",  "Lahore","Punjab",  "Operations Supervisor",    58000,"2022-10-01","active",15,3),
  emp("emp-l12","off-2","Customer Support", "Shazia Begum",     "Begum Ashraf",    "35212-3232323-3","0325-3233233","shazia.b@techcorp.pk",       "1996-07-17","Female","Lahore","Punjab",  "Support Executive",        37000,"2023-05-01","active",12,1),
  emp("emp-l13","off-2","Engineering",      "Khurram Ali",      "Ali Shahzad",     "35213-4343434-4","0326-4344344","khurram.a@techcorp.pk",      "1990-12-28","Male",  "Lahore","Punjab",  "DevOps Engineer",          80000,"2022-01-15","active",20,0),
  emp("emp-l14","off-2","Human Resources",  "Farida Khan",      "Khan Obaid",      "35214-5454545-5","0327-5455455","farida.k@techcorp.pk",       "1985-09-09","Female","Lahore","Punjab",  "HR Manager",               68000,"2021-10-01","active",20,2),

  // ── Islamabad (off-3) ─────────────────────────────────────────────────────
  emp("emp-i01","off-3","Finance",          "Naveed Ahmad",     "Ahmad Saeed",     "61101-1111111-1","0328-1011011","naveed.a@techcorp.pk",       "1979-06-12","Male",  "Islamabad","ICT",  "CFO",                     135000,"2020-04-01","active",30,5),
  emp("emp-i02","off-3","Engineering",      "Amina Rashid",     "Rashid Kamal",    "61102-2222222-2","0329-2122122","amina.r@techcorp.pk",        "1989-02-28","Female","Islamabad","ICT",  "Senior Software Engineer", 87000,"2021-08-01","active",20,1),
  emp("emp-i03","off-3","Engineering",      "Omer Farooq",      "Farooq Khalil",   "61103-3333333-3","0330-3233233","omer.f@techcorp.pk",         "1993-04-16","Male",  "Islamabad","ICT",  "Software Engineer",        62000,"2022-09-01","active",15,2),
  emp("emp-i04","off-3","Engineering",      "Ghazala Akbar",    "Akbar Shafiq",    "61104-4444444-4","0331-4344344","ghazala.a@techcorp.pk",      "1995-11-23","Female","Islamabad","ICT",  "QA Engineer",              53000,"2023-02-15","active",12,1),
  emp("emp-i05","off-3","Sales & Marketing","Tahir Pervaiz",    "Pervaiz Sajjad",  "61105-5555555-5","0332-5455455","tahir.p@techcorp.pk",        "1994-07-07","Male",  "Islamabad","ICT",  "Sales Executive",          42000,"2023-04-01","active",12,0),
  emp("emp-i06","off-3","Finance",          "Sobia Mehmood",    "Mehmood Anwar",   "61106-6666666-6","0333-6566566","sobia.m@techcorp.pk",        "1986-01-15","Female","Islamabad","ICT",  "Finance Manager",          78000,"2021-05-01","active",20,1),
  emp("emp-i07","off-3","Finance",          "Rizwan Haider",    "Haider Maqbool",  "61107-7777777-7","0334-7677677","rizwan.h@techcorp.pk",       "1991-08-20","Male",  "Islamabad","ICT",  "Accountant",               52000,"2022-11-01","active",15,2),
  emp("emp-i08","off-3","Operations",       "Naeem Khan",       "Khan Mushtaq",    "61108-8888888-8","0335-8788788","naeem.k@techcorp.pk",        "1984-03-31","Male",  "Islamabad","ICT",  "Operations Manager",       71000,"2021-07-15","active",20,4),
  emp("emp-i09","off-3","Human Resources",  "Saima Aslam",      "Aslam Zubair",    "61109-9999999-9","0336-9899899","saima.a@techcorp.pk",        "1993-10-05","Female","Islamabad","ICT",  "HR Executive",             43000,"2023-06-01","active",12,0),
  emp("emp-i10","off-3","Customer Support", "Usman Ghani",      "Ghani Imtiaz",    "61110-1010101-1","0337-1011011","usman.g@techcorp.pk",        "1997-12-12","Male",  "Islamabad","ICT",  "Support Executive",        36000,"2023-08-01","active",12,1),
  emp("emp-i11","off-3","Sales & Marketing","Madiha Zahoor",    "Zahoor Ilyas",    "61111-2121212-2","0338-2122122","madiha.z@techcorp.pk",       "1987-05-18","Female","Islamabad","ICT",  "Sales Manager",            71000,"2021-11-01","active",20,2),
  emp("emp-i12","off-3","Engineering",      "Asad Baig",        "Baig Tanveer",    "61112-3232323-3","0339-3233233","asad.b@techcorp.pk",         "1988-09-03","Male",  "Islamabad","ICT",  "Senior Software Engineer", 86000,"2021-12-01","active",20,1),
];

// ── attendance ────────────────────────────────────────────────────────────────
const STATUSES: Array<"present"|"absent"|"half-day"|"late"|"on-leave"> =
  ["present","present","present","present","present","present","present","late","absent","half-day"];

function genAttendance() {
  const days = workingDays(10);
  const records: object[] = [];
  let idx = 0;
  for (const emp of EMPLOYEES) {
    for (const date of days) {
      const roll = hash(emp.id + date) % 10;
      const status = STATUSES[roll];
      const isPresent = status === "present" || status === "late" || status === "half-day";
      const checkInHour = status === "late" ? "10" : "09";
      const checkInMin = status === "late" ? String(hash(emp.id + date + "m") % 45 + 5).padStart(2, "0") : "00";
      records.push({
        id: `att-${idx++}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        officeId: emp.officeId,
        date,
        status,
        checkIn:  isPresent ? `${checkInHour}:${checkInMin}` : "",
        checkOut: isPresent && status !== "half-day" ? "18:00" : isPresent ? "13:00" : "",
        note: status === "absent" ? "No show" : status === "on-leave" ? "Approved leave" : "",
        createdAt: `${date}T08:00:00Z`,
      });
    }
  }
  return records;
}

// ── leave records ─────────────────────────────────────────────────────────────
const LEAVES = [
  { id:"lr-1",  employeeId:"emp-k03", employeeName:"Usman Khan",     leaveType:"Annual Leave",    startDate:"2026-09-01", endDate:"2026-09-03", totalDays:3,  reason:"Family vacation",                     status:"approved", approvedBy:"Admin", approvalNote:"Approved. Enjoy!", reportingToId:"emp-k02", reportingToName:"Sana Iqbal",    createdAt:"2026-08-25T10:00:00Z" },
  { id:"lr-2",  employeeId:"emp-k07", employeeName:"Bilal Ahmed",    leaveType:"Sick Leave",      startDate:"2026-09-08", endDate:"2026-09-09", totalDays:2,  reason:"Fever and flu",                        status:"approved", approvedBy:"Admin", approvalNote:"Get well soon",    reportingToId:"emp-k06", reportingToName:"Nadia Hussain",  createdAt:"2026-09-07T09:00:00Z" },
  { id:"lr-3",  employeeId:"emp-l04", employeeName:"Sadia Anwar",    leaveType:"Casual Leave",    startDate:"2026-09-10", endDate:"2026-09-10", totalDays:1,  reason:"Personal errand",                      status:"pending",  approvedBy:"",      approvalNote:"",                 reportingToId:"emp-l02", reportingToName:"Ayesha Butt",    createdAt:"2026-09-09T11:00:00Z" },
  { id:"lr-4",  employeeId:"emp-k05", employeeName:"Kamran Malik",   leaveType:"Emergency Leave", startDate:"2026-09-05", endDate:"2026-09-05", totalDays:1,  reason:"Father hospitalised",                  status:"approved", approvedBy:"Admin", approvalNote:"Approved",         reportingToId:"emp-k02", reportingToName:"Sana Iqbal",    createdAt:"2026-09-05T08:00:00Z" },
  { id:"lr-5",  employeeId:"emp-i03", employeeName:"Omer Farooq",    leaveType:"Annual Leave",    startDate:"2026-09-15", endDate:"2026-09-19", totalDays:5,  reason:"Eid holidays extension",               status:"pending",  approvedBy:"",      approvalNote:"",                 reportingToId:"emp-i02", reportingToName:"Amina Rashid",   createdAt:"2026-09-10T14:00:00Z" },
  { id:"lr-6",  employeeId:"emp-l09", employeeName:"Nasir Ahmed",    leaveType:"Sick Leave",      startDate:"2026-08-28", endDate:"2026-08-29", totalDays:2,  reason:"Stomach infection",                    status:"approved", approvedBy:"Admin", approvalNote:"Noted",            reportingToId:"emp-l14", reportingToName:"Farida Khan",    createdAt:"2026-08-27T09:00:00Z" },
  { id:"lr-7",  employeeId:"emp-k11", employeeName:"Maryam Siddiqui",leaveType:"Casual Leave",    startDate:"2026-09-04", endDate:"2026-09-04", totalDays:1,  reason:"Sibling's nikah",                      status:"approved", approvedBy:"Admin", approvalNote:"Approved",         reportingToId:"emp-k10", reportingToName:"Waqar Abbas",    createdAt:"2026-09-03T17:00:00Z" },
  { id:"lr-8",  employeeId:"emp-l05", employeeName:"Tariq Javed",    leaveType:"Annual Leave",    startDate:"2026-09-22", endDate:"2026-09-26", totalDays:5,  reason:"Travelling abroad",                    status:"pending",  approvedBy:"",      approvalNote:"",                 reportingToId:"emp-l01", reportingToName:"Imran Shah",     createdAt:"2026-09-11T10:00:00Z" },
  { id:"lr-9",  employeeId:"emp-i09", employeeName:"Saima Aslam",    leaveType:"Emergency Leave", startDate:"2026-09-09", endDate:"2026-09-09", totalDays:1,  reason:"Water pipe burst at home",             status:"approved", approvedBy:"Admin", approvalNote:"Noted",            reportingToId:"emp-i01", reportingToName:"Naveed Ahmad",   createdAt:"2026-09-09T08:30:00Z" },
  { id:"lr-10", employeeId:"emp-l12", employeeName:"Shazia Begum",   leaveType:"Sick Leave",      startDate:"2026-09-03", endDate:"2026-09-03", totalDays:1,  reason:"Migraine",                             status:"rejected", approvedBy:"Admin", approvalNote:"Critical project", reportingToId:"emp-l01", reportingToName:"Imran Shah",     createdAt:"2026-09-02T15:00:00Z" },
  { id:"lr-11", employeeId:"emp-k04", employeeName:"Zara Ali",       leaveType:"Maternity Leave", startDate:"2026-10-01", endDate:"2026-12-29", totalDays:90, reason:"Maternity leave",                      status:"approved", approvedBy:"Admin", approvalNote:"All the best!",    reportingToId:"emp-k02", reportingToName:"Sana Iqbal",    createdAt:"2026-09-05T10:00:00Z" },
  { id:"lr-12", employeeId:"emp-i05", employeeName:"Tahir Pervaiz",  leaveType:"Unpaid Leave",    startDate:"2026-09-15", endDate:"2026-09-16", totalDays:2,  reason:"Personal work in hometown",            status:"pending",  approvedBy:"",      approvalNote:"",                 reportingToId:"emp-i11", reportingToName:"Madiha Zahoor",  createdAt:"2026-09-10T16:00:00Z" },
  { id:"lr-13", employeeId:"emp-l07", employeeName:"Hamid Rajput",   leaveType:"Casual Leave",    startDate:"2026-08-21", endDate:"2026-08-21", totalDays:1,  reason:"Driving license renewal",              status:"approved", approvedBy:"Admin", approvalNote:"Ok",               reportingToId:"emp-l06", reportingToName:"Munira Saleem",  createdAt:"2026-08-20T10:00:00Z" },
  { id:"lr-14", employeeId:"emp-k14", employeeName:"Faisal Khalid",  leaveType:"Study Leave",     startDate:"2026-09-20", endDate:"2026-09-21", totalDays:2,  reason:"University exam",                      status:"pending",  approvedBy:"",      approvalNote:"",                 reportingToId:"emp-k13", reportingToName:"Rabia Noor",     createdAt:"2026-09-11T11:00:00Z" },
  { id:"lr-15", employeeId:"emp-i08", employeeName:"Naeem Khan",     leaveType:"Annual Leave",    startDate:"2026-08-18", endDate:"2026-08-22", totalDays:5,  reason:"Family trip to Murree",                status:"approved", approvedBy:"Admin", approvalNote:"Enjoy",            reportingToId:"emp-i01", reportingToName:"Naveed Ahmad",   createdAt:"2026-08-15T09:00:00Z" },
];

// ── salary payments ──────────────────────────────────────────────────────────
function genSalaries() {
  const payments: object[] = [];
  const month = "2026-09";
  // Pay ~30 of 40 employees this month
  const paidIds = EMPLOYEES.slice(0, 32).map(e => e.id);
  let i = 0;
  for (const id of paidIds) {
    const emp = EMPLOYEES.find(e => e.id === id)!;
    payments.push({
      id: `pay-${i++}`,
      employeeId: emp.id,
      month,
      baseSalary: emp.salary,
      advance: 0,
      deduction: 0,
      commission: 0,
      netPaid: emp.salary,
      note: "Monthly salary",
      paidDate: `${month}-05`,
      type: "salary",
    });
  }
  return payments;
}

// ── main export ───────────────────────────────────────────────────────────────
export function seedAll() {
  // Always nuke all old seed keys so fresh data is loaded on page refresh
  const oldKeys = ["hostel_seeded_v6","hostel_employees_seeded_v1",
    "tm_seeded_v1","tm_seeded_v2","tm_seeded_v3"];
  oldKeys.forEach(k => localStorage.removeItem(k));

  // Always ensure staff accounts exist (even if main seed already ran)
  if (!localStorage.getItem("tm_staff")) {
    localStorage.setItem("tm_staff", JSON.stringify(STAFF));
  }

  if (localStorage.getItem(SEED_KEY)) return;

  // Clear existing data
  const keys = [
    "team_offices","hostel_employees","tm_departments","tm_designations",
    "tm_leave_types","team_attendance","hostel_employee_leaves",
    "hostel_salary_payments","tm_staff",
  ];
  keys.forEach(k => localStorage.removeItem(k));

  localStorage.setItem("team_offices",             JSON.stringify(OFFICES));
  localStorage.setItem("tm_staff",                JSON.stringify(STAFF));

  localStorage.setItem("tm_departments",           JSON.stringify(DEPARTMENTS));
  localStorage.setItem("tm_designations",          JSON.stringify(DESIGNATIONS));
  localStorage.setItem("tm_leave_types",           JSON.stringify(LEAVE_TYPES));
  localStorage.setItem("hostel_employees",         JSON.stringify(EMPLOYEES));
  localStorage.setItem("team_attendance",          JSON.stringify(genAttendance()));
  localStorage.setItem("hostel_employee_leaves",   JSON.stringify(LEAVES));
  localStorage.setItem("hostel_salary_payments",   JSON.stringify(genSalaries()));

  localStorage.setItem(SEED_KEY, "true");
}
