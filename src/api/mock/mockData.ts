import type {
  TeamStatus,
  RegistrationStatus,
  MemberType,
  RegistrantType,
} from "@/types/common.types";
import type { League } from "@/constants/leagues";
import type { Role, User } from "@/types/users.types";

export interface RawTeam {
  id: string;
  name: string;
  code: string;
  teamCode: string; // Canonical format: TM-KSPL-001 or TM-ISCL-001
  league: League;
  franchiseId: string;
  status: TeamStatus;
  licensed: boolean;
  maxCap: number;
  registrationsTotal: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RawMember {
  id: string;
  registrationId: string;
  teamId: string;
  fullName: string;
  avatarUrl?: string;
  designation?: string;
  isVip: boolean;
  memberType: MemberType;
  registrantType: RegistrantType;
  roleTitle: string;
  contactNumber: string;
  emailAddress: string;
  status: RegistrationStatus;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationPasscode?: string;
  passcodeSentTime?: string;
  mealPreference: string;
  dateOfBirth: string;
  division: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  adminRemarks?: string;
  mealCodeGenerated?: string;
  photo: {
    previewUrl: string;
    fileName: string;
    fileSize: string;
    dimensions: string;
  };
}

export interface RawStaff {
  id: string;
  registrationId: string;
  fullName: string;
  avatarUrl?: string;
  designation?: string;
  isVip: boolean;
  role: string;
  department: string;
  contactNumber: string;
  emailAddress: string;
  status: RegistrationStatus;
  submittedAt: string;
  mealEligible: boolean;
  mealPreference: string;
  dateOfBirth: string;
  rejectionReason?: string;
  photo: {
    previewUrl: string;
    fileName: string;
    fileSize: string;
    dimensions: string;
  };
}

export interface RawOrganizer {
  id: string;
  registrationId: string;
  fullName: string;
  avatarUrl?: string;
  designation?: string;
  isVip: boolean;
  role: string;
  organization: string;
  contactNumber: string;
  emailAddress: string;
  status: RegistrationStatus;
  submittedAt: string;
  mealEligible: boolean;
  mealPreference: string;
  dateOfBirth: string;
  rejectionReason?: string;
  photo: {
    previewUrl: string;
    fileName: string;
    fileSize: string;
    dimensions: string;
  };
}

export interface RawAuditEntry {
  id: string;
  actor: string;
  action: string;
  targetId?: string;
  details?: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
  reason?: string;
  notes?: string;
}

// 24 Teams (14 KSPL, 10 ISCL; Exactly 18 Active, 6 Inactive)
export const INITIAL_TEAMS: RawTeam[] = [
  // 1. KSPL Teams (14: 12 Active, 2 Inactive)
  {
    id: "chennai-kings",
    name: "Chennai Kings",
    code: "CK",
    teamCode: "TM-KSPL-001",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-CK-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 24,
    approvedCount: 18,
    pendingCount: 4,
    rejectedCount: 2,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "14 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "madurai-warriors",
    name: "Madurai Warriors",
    code: "MW",
    teamCode: "TM-KSPL-002",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-MW-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 20,
    approvedCount: 15,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-12T09:00:00Z",
    updatedAt: "12 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "trichy-panthers",
    name: "Trichy Panthers",
    code: "TP",
    teamCode: "TM-KSPL-003",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-TP-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 19,
    approvedCount: 16,
    pendingCount: 2,
    rejectedCount: 1,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "11 Feb 2026",
    updatedBy: "System Migration",
  },
  {
    id: "bangalore-blasters",
    name: "Bangalore Blasters",
    code: "BB",
    teamCode: "TM-KSPL-004",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-BB-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 22,
    approvedCount: 18,
    pendingCount: 3,
    rejectedCount: 1,
    createdAt: "2026-01-18T11:00:00Z",
    updatedAt: "10 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "mysore-royals",
    name: "Mysore Royals",
    code: "MR",
    teamCode: "TM-KSPL-005",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-MR-2026",
    status: "ACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 18,
    approvedCount: 14,
    pendingCount: 3,
    rejectedCount: 1,
    createdAt: "2026-01-20T12:00:00Z",
    updatedAt: "08 Feb 2026",
    updatedBy: "System Migration",
  },
  {
    id: "hubli-tigers",
    name: "Hubli Tigers",
    code: "HT",
    teamCode: "TM-KSPL-006",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-HT-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 20,
    approvedCount: 16,
    pendingCount: 2,
    rejectedCount: 2,
    createdAt: "2026-01-22T13:00:00Z",
    updatedAt: "07 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "bengaluru-royals",
    name: "Bengaluru Royals",
    code: "BR",
    teamCode: "TM-KSPL-007",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-BR-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 25,
    approvedCount: 22,
    pendingCount: 2,
    rejectedCount: 1,
    createdAt: "2026-01-23T14:00:00Z",
    updatedAt: "06 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "mangalore-sharks",
    name: "Mangalore Sharks",
    code: "MS",
    teamCode: "TM-KSPL-008",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-MS-2026",
    status: "ACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 17,
    approvedCount: 13,
    pendingCount: 3,
    rejectedCount: 1,
    createdAt: "2026-01-24T14:00:00Z",
    updatedAt: "05 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "belagavi-panthers",
    name: "Belagavi Panthers",
    code: "BP",
    teamCode: "TM-KSPL-009",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-BP-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 19,
    approvedCount: 15,
    pendingCount: 2,
    rejectedCount: 2,
    createdAt: "2026-01-26T15:00:00Z",
    updatedAt: "04 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "bellary-tuskers",
    name: "Bellary Tuskers",
    code: "BT",
    teamCode: "TM-KSPL-010",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-BT-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 16,
    approvedCount: 12,
    pendingCount: 2,
    rejectedCount: 2,
    createdAt: "2026-01-28T16:00:00Z",
    updatedAt: "03 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "shivamogga-lions",
    name: "Shivamogga Lions",
    code: "SL",
    teamCode: "TM-KSPL-011",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-SL-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 18,
    approvedCount: 14,
    pendingCount: 3,
    rejectedCount: 1,
    createdAt: "2026-01-30T17:00:00Z",
    updatedAt: "02 Feb 2026",
    updatedBy: "System Migration",
  },
  {
    id: "davanagere-dragons",
    name: "Davanagere Dragons",
    code: "DD",
    teamCode: "TM-KSPL-012",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-DD-2026",
    status: "ACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 15,
    approvedCount: 11,
    pendingCount: 2,
    rejectedCount: 2,
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "01 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "udupi-waves",
    name: "Udupi Waves",
    code: "UW",
    teamCode: "TM-KSPL-013",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-UW-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 25,
    registrationsTotal: 16,
    approvedCount: 12,
    pendingCount: 3,
    rejectedCount: 1,
    createdAt: "2026-02-02T09:00:00Z",
    updatedAt: "31 Jan 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "gulbarga-gladiators",
    name: "Gulbarga Gladiators",
    code: "GG",
    teamCode: "TM-KSPL-014",
    league: "KSPL",
    franchiseId: "FRAN-KSPL-GG-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 14,
    approvedCount: 10,
    pendingCount: 2,
    rejectedCount: 2,
    createdAt: "2026-02-04T11:00:00Z",
    updatedAt: "28 Jan 2026",
    updatedBy: "Alex Morgan",
  },

  // 2. ISCL Teams (10: 6 Active, 4 Inactive)
  {
    id: "salem-strikers",
    name: "Salem Strikers",
    code: "SS",
    teamCode: "TM-ISCL-001",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-SS-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 22,
    approvedCount: 17,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-11T09:00:00Z",
    updatedAt: "13 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "coimbatore-lions",
    name: "Coimbatore Lions",
    code: "CL",
    teamCode: "TM-ISCL-002",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-CL-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 18,
    approvedCount: 12,
    pendingCount: 4,
    rejectedCount: 2,
    createdAt: "2026-01-14T10:00:00Z",
    updatedAt: "12 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "erode-titans",
    name: "Erode Titans",
    code: "ET",
    teamCode: "TM-ISCL-003",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-ET-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 21,
    approvedCount: 14,
    pendingCount: 4,
    rejectedCount: 3,
    createdAt: "2026-01-16T11:00:00Z",
    updatedAt: "11 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "mumbai-mavericks",
    name: "Mumbai Mavericks",
    code: "MM",
    teamCode: "TM-ISCL-004",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-MM-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 25,
    approvedCount: 20,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-17T12:00:00Z",
    updatedAt: "09 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "kochi-strikers",
    name: "Kochi Strikers",
    code: "KS",
    teamCode: "TM-ISCL-005",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-KS-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 18,
    approvedCount: 13,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-19T13:00:00Z",
    updatedAt: "08 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "delhi-dynamos",
    name: "Delhi Dynamos",
    code: "DDN",
    teamCode: "TM-ISCL-006",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-DDN-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 20,
    approvedCount: 15,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-21T14:00:00Z",
    updatedAt: "07 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "kolkata-knights",
    name: "Kolkata Knights",
    code: "KK",
    teamCode: "TM-ISCL-007",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-KK-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 18,
    approvedCount: 12,
    pendingCount: 4,
    rejectedCount: 2,
    createdAt: "2026-01-23T15:00:00Z",
    updatedAt: "05 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "hyderabad-hawks",
    name: "Hyderabad Hawks",
    code: "HH",
    teamCode: "TM-ISCL-008",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-HH-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 22,
    approvedCount: 17,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-25T16:00:00Z",
    updatedAt: "04 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "chennai-challengers",
    name: "Chennai Challengers",
    code: "CC",
    teamCode: "TM-ISCL-009",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-CC-2026",
    status: "ACTIVE",
    licensed: true,
    maxCap: 28,
    registrationsTotal: 20,
    approvedCount: 15,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-27T17:00:00Z",
    updatedAt: "03 Feb 2026",
    updatedBy: "Alex Morgan",
  },
  {
    id: "pune-patriots",
    name: "Pune Patriots",
    code: "PP",
    teamCode: "TM-ISCL-010",
    league: "ISCL",
    franchiseId: "FRAN-ISCL-PP-2026",
    status: "INACTIVE",
    licensed: false,
    maxCap: 25,
    registrationsTotal: 17,
    approvedCount: 12,
    pendingCount: 3,
    rejectedCount: 2,
    createdAt: "2026-01-29T18:00:00Z",
    updatedAt: "02 Feb 2026",
    updatedBy: "Alex Morgan",
  },
];

// Seeded Player Names Pool
const FIRST_NAMES = [
  "John",
  "Ravichandran",
  "Virat",
  "Rohit",
  "Dinesh",
  "Suresh",
  "Hardik",
  "Jasprit",
  "Shikhar",
  "Ajinkya",
  "KL",
  "Rishabh",
  "Shubman",
  "Mohammed",
  "Ravindra",
  "Bhuvneshwar",
  "Yuzvendra",
  "Kuldeep",
  "Axar",
  "Shardul",
  "Ishan",
  "Sanju",
  "Deepak",
  "Washington",
  "Prithvi",
  "Ruturaj",
  "Arshdeep",
  "Umran",
  "Mayank",
  "Manish",
  "Krunal",
  "Varun",
];

const LAST_NAMES = [
  "Smith",
  "Ashwin",
  "Kohli",
  "Sharma",
  "Karthik",
  "Raina",
  "Pandya",
  "Bumrah",
  "Dhawan",
  "Rahane",
  "Rahul",
  "Pant",
  "Gill",
  "Siraj",
  "Jadeja",
  "Kumar",
  "Chahal",
  "Yadav",
  "Patel",
  "Thakur",
  "Kishan",
  "Samson",
  "Chahar",
  "Sundar",
  "Shaw",
  "Gaikwad",
  "Singh",
  "Malik",
  "Agarwal",
  "Pandey",
  "Chakravarthy",
  "Natarajan",
];

// Generate deterministic members for all 24 teams
function generateInitialMembers(): RawMember[] {
  const members: RawMember[] = [];
  let globalIndex = 1;

  INITIAL_TEAMS.forEach((team, tIdx) => {
    const { approvedCount, pendingCount, rejectedCount } = team;
    const totalForTeam = approvedCount + pendingCount + rejectedCount;

    for (let i = 1; i <= totalForTeam; i++) {
      const seed = tIdx * 100 + i;
      const fn = FIRST_NAMES[(tIdx * 3 + i) % FIRST_NAMES.length] ?? "Member";
      const ln = LAST_NAMES[(tIdx * 2 + i * 5) % LAST_NAMES.length] ?? "User";
      const fullName = `${fn} ${ln}`;

      let status: RegistrationStatus = "APPROVED";
      if (i > approvedCount + pendingCount) {
        status = "REJECTED";
      } else if (i > approvedCount) {
        status = "PENDING";
      }

      const isCaptain = i === 1;
      const isViceCaptain = i === 2;
      const isCoach = i === 3;
      const isPhysio = i === 4;

      let memberType: MemberType = "PLAYER";
      let roleTitle = `Player (${team.name})`;
      let designation: string | undefined = undefined;
      let isVip = false;

      if (isCaptain) {
        roleTitle = "Player (Captain)";
        designation = "Team Captain";
        isVip = true;
      } else if (isViceCaptain) {
        roleTitle = "Player (Vice Captain)";
        designation = "Vice Captain";
        isVip = true;
      } else if (isCoach) {
        memberType = "COACH";
        roleTitle = `Head Coach (${team.name})`;
        designation = "Head Coach";
        isVip = true;
      } else if (isPhysio) {
        memberType = "STAFF";
        roleTitle = `Physiotherapist (${team.name})`;
        designation = "Lead Physio";
      }

      const regNum = String(globalIndex).padStart(3, "0");
      const registrationId = `${team.code}-2026-${regNum}`;
      const dayOffset = (seed % 20) + 1;
      const submittedAt = `2026-10-${dayOffset < 10 ? "0" + dayOffset : dayOffset}T10:00:00Z`;

      members.push({
        id: `mem-${team.code.toLowerCase()}-${regNum}`,
        registrationId,
        teamId: team.id,
        fullName,
        designation,
        isVip,
        memberType,
        registrantType: "TEAM",
        roleTitle,
        contactNumber: `+91 ${9800000000 + ((seed * 12345) % 199999999)}`,
        emailAddress: `${fn.toLowerCase()}.${ln.toLowerCase()}@${team.id.replace(/-/g, "")}.org`,
        status,
        submittedAt,
        verifiedAt: status === "APPROVED" ? "2026-11-01T14:30:00Z" : undefined,
        verifiedBy: status === "APPROVED" ? "Alex Morgan" : undefined,
        verificationPasscode: "VCD-8842-ISCL",
        passcodeSentTime: "Today 14:31 IST",
        mealPreference:
          i % 3 === 0 ? "Vegetarian" : i % 3 === 1 ? "Non-veg" : "Jain",
        dateOfBirth: "14 Aug 1996",
        division: team.name,
        rejectionReason:
          status === "REJECTED"
            ? "Uploaded portrait does not comply with accreditation criteria (resolution < 600px)."
            : undefined,
        photo: {
          previewUrl: `https://images.unsplash.com/photo-${1500000000000 + (seed % 10000000)}?w=300&auto=format&fit=crop&q=80`,
          fileName: `photo_${regNum}.jpg`,
          fileSize: "2.1 MB",
          dimensions: "1200 x 1600 px",
        },
      });

      globalIndex++;
    }
  });

  return members;
}

export const INITIAL_MEMBERS: RawMember[] = generateInitialMembers();

// Generate 268 Staff (210 Approved, 46 Pending, 12 Rejected; 4 with meal access disabled)
function generateInitialStaff(): RawStaff[] {
  const staff: RawStaff[] = [];
  const departments = [
    "Medical & Emergency Care",
    "Security & Gate Access Operations",
    "Hospitality & Dining Concierge",
    "Transport & Ground Fleet",
    "Media & Broadcasting Ops",
    "Logistics & Equipment Desk",
  ];
  const roles = [
    "Chief Medical Officer",
    "Security Gate Supervisor",
    "Hospitality Lead",
    "Fleet Coordinator",
    "Technical Operator",
    "Paramedic Specialist",
  ];

  for (let i = 1; i <= 268; i++) {
    const seed = 5000 + i;
    const fn = FIRST_NAMES[(i * 7) % FIRST_NAMES.length] ?? "Staff";
    const ln = LAST_NAMES[(i * 11) % LAST_NAMES.length] ?? "Member";
    const fullName = `${fn} ${ln}`;
    const regNum = String(i).padStart(3, "0");

    let status: RegistrationStatus = "APPROVED";
    if (i > 210 + 46) {
      status = "REJECTED";
    } else if (i > 210) {
      status = "PENDING";
    }

    // 4 approved staff have meal pass explicitly disabled to test 'access_disabled'
    const mealEligible =
      status === "APPROVED"
        ? i !== 5 && i !== 12 && i !== 25 && i !== 42
        : false;
    const isVip = i <= 3; // First 3 are VIP leads

    staff.push({
      id: `stf-${regNum}`,
      registrationId: `REG-ST-${regNum}`,
      fullName,
      isVip,
      designation: isVip ? "Logistics Lead" : undefined,
      role: roles[i % roles.length] ?? "Support Staff",
      department: departments[i % departments.length] ?? "Operations",
      contactNumber: `+91 ${9700000000 + ((seed * 54321) % 199999999)}`,
      emailAddress: `${fn.toLowerCase()}.${ln.toLowerCase()}@iscl-staff.org`,
      status,
      submittedAt: `2026-10-${(i % 25) + 1 < 10 ? "0" + ((i % 25) + 1) : (i % 25) + 1}T09:00:00Z`,
      mealEligible,
      mealPreference: i % 2 === 0 ? "Non-veg" : "Vegetarian",
      dateOfBirth: "16 Nov 1988",
      rejectionReason:
        status === "REJECTED"
          ? "Incomplete government ID verification documentation."
          : undefined,
      photo: {
        previewUrl:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
        fileName: `staff_${regNum}.jpg`,
        fileSize: "1.9 MB",
        dimensions: "800 x 800 px",
      },
    });
  }

  return staff;
}

export const INITIAL_STAFF: RawStaff[] = generateInitialStaff();

// Generate 34 Organizers (28 Approved, 4 Pending, 2 Rejected; 2 with meal access disabled)
function generateInitialOrganizers(): RawOrganizer[] {
  const organizers: RawOrganizer[] = [];
  const orgs = [
    "Tournament Executive Council",
    "League Operations Directorate",
    "Accreditation & Protocol Bureau",
    "Broadcast & Media Committee",
  ];
  const roles = [
    "Tournament Director",
    "Chief Protocol Officer",
    "Executive Match Commissioner",
    "Technical Director",
    "Operations Steward",
  ];

  for (let i = 1; i <= 34; i++) {
    const seed = 9000 + i;
    const fn = FIRST_NAMES[(i * 13) % FIRST_NAMES.length] ?? "Organizer";
    const ln = LAST_NAMES[(i * 17) % LAST_NAMES.length] ?? "Official";
    const fullName = `${fn} ${ln}`;
    const regNum = String(i).padStart(3, "0");

    let status: RegistrationStatus = "APPROVED";
    if (i > 28 + 4) {
      status = "REJECTED";
    } else if (i > 28) {
      status = "PENDING";
    }

    // 2 approved organizers have meal pass explicitly disabled
    const mealEligible = status === "APPROVED" ? i !== 3 && i !== 14 : false;
    const isVip = i <= 5; // Top 5 executives are VIP

    organizers.push({
      id: `org-${regNum}`,
      registrationId: `ORG-2026-${regNum}`,
      fullName,
      isVip,
      designation: isVip ? "Tournament Executive" : undefined,
      role: roles[i % roles.length] ?? "Official",
      organization: orgs[i % orgs.length] ?? "Jeffs Group",
      contactNumber: `+91 ${9600000000 + ((seed * 65432) % 199999999)}`,
      emailAddress: `${fn.toLowerCase()}.${ln.toLowerCase()}@kspl-organizers.org`,
      status,
      submittedAt: `2026-10-${(i % 20) + 1 < 10 ? "0" + ((i % 20) + 1) : (i % 20) + 1}T11:00:00Z`,
      mealEligible,
      mealPreference: "Non-veg",
      dateOfBirth: "24 Sep 1982",
      rejectionReason:
        status === "REJECTED"
          ? "Executive clearance withheld pending security audit."
          : undefined,
      photo: {
        previewUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        fileName: `org_${regNum}.jpg`,
        fileSize: "2.3 MB",
        dimensions: "1200 x 1600 px",
      },
    });
  }

  return organizers;
}

export const INITIAL_ORGANIZERS: RawOrganizer[] = generateInitialOrganizers();

export const INITIAL_AUDIT_LOGS: RawAuditEntry[] = [
  {
    id: "aud-001",
    actor: "Alex Morgan",
    action: "APPROVE_REGISTRANT",
    targetId: "CK-2026-001",
    details: "Approved registration and generated digital catering credential.",
    timestamp: "2026-11-03T14:30:00Z",
  },
  {
    id: "aud-002",
    actor: "Alex Morgan",
    action: "DEACTIVATE_TEAM",
    targetId: "TM-KSPL-010",
    details:
      "Deactivated team Bellary Tuskers. Suspended meal eligibility for 12 approved members.",
    timestamp: "2026-11-02T16:00:00Z",
  },
];

// Initial 4 Roles
export const INITIAL_ROLES: Role[] = [
  {
    id: "role-admin",
    code: "ROLE-001",
    name: "Administrator",
    description:
      "Root administrative role with uninhibited operational privileges across all tournament modules.",
    tier: "superadmin",
    isSystem: true,
    status: "active",
    permissions: {
      dashboard: ["view", "create", "edit", "manage"],
      registrations: ["view", "create", "edit", "manage"],
      teams: ["view", "create", "edit", "manage"],
      reports: ["view", "create", "edit", "manage"],
      users: ["view", "create", "edit", "manage"],
    },
    assignedUserCount: 2,
    assignedUsersPreview: [
      { id: "usr-001", name: "Alex Morgan", initials: "AM" },
      { id: "usr-002", name: "Priya Sharma", initials: "PS" },
    ],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    updatedBy: "System Preset",
  },
  {
    id: "role-reg-manager",
    code: "ROLE-002",
    name: "Registration Manager",
    description:
      "Manages player accreditations, team staff enrollments, and attendee verification queues.",
    tier: "delegated",
    isSystem: false,
    status: "active",
    permissions: {
      dashboard: ["view"],
      registrations: ["view", "create", "edit"],
      teams: ["view"],
      reports: ["view"],
      users: [],
    },
    assignedUserCount: 4,
    assignedUsersPreview: [
      { id: "usr-003", name: "Karthik Raja", initials: "KR" },
      { id: "usr-004", name: "Anita Desai", initials: "AD" },
      { id: "usr-005", name: "Vikram Patel", initials: "VP" },
    ],
    createdAt: "2026-07-15T09:30:00Z",
    updatedAt: "2026-10-20T12:00:00Z",
    updatedBy: "Alex Morgan",
  },
  {
    id: "role-team-manager",
    code: "ROLE-003",
    name: "Team Manager",
    description:
      "Coordinates league franchises, roster submissions, and team profile authorizations.",
    tier: "delegated",
    isSystem: false,
    status: "active",
    permissions: {
      dashboard: ["view"],
      registrations: ["view"],
      teams: ["view", "create", "edit"],
      reports: ["view"],
      users: [],
    },
    assignedUserCount: 4,
    assignedUsersPreview: [
      { id: "usr-007", name: "Rahul Verma", initials: "RV" },
      { id: "usr-008", name: "Deepa Krishnan", initials: "DK" },
      { id: "usr-009", name: "Rohan Mehra", initials: "RM" },
    ],
    createdAt: "2026-07-18T14:15:00Z",
    updatedAt: "2026-10-25T11:45:00Z",
    updatedBy: "Alex Morgan",
  },
  {
    id: "role-report-viewer",
    code: "ROLE-004",
    name: "Report Viewer",
    description:
      "Read-only analytical visibility across attendance reports and catering meal logs.",
    tier: "delegated",
    isSystem: false,
    status: "active",
    permissions: {
      dashboard: ["view"],
      registrations: [],
      teams: [],
      reports: ["view"],
      users: [],
    },
    assignedUserCount: 2,
    assignedUsersPreview: [
      { id: "usr-011", name: "Amit Joshi", initials: "AJ" },
      { id: "usr-012", name: "Pooja Hegde", initials: "PH" },
    ],
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-09-15T16:20:00Z",
    updatedBy: "Alex Morgan",
  },
];

// Initial 12 Users (10 Active, 2 Inactive)
export const INITIAL_USERS: User[] = [
  {
    id: "usr-001",
    name: "Alex Morgan",
    email: "alex.morgan@jeffsgroup.org",
    contact: "+91 98450 12345",
    roleId: "role-admin",
    roleName: "Administrator",
    roleCode: "ROLE-001",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "Today, 14:10 IST",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    isCurrentUser: true,
  },
  {
    id: "usr-002",
    name: "Priya Sharma",
    email: "priya.sharma@kspl.org",
    contact: "+91 98450 23456",
    roleId: "role-admin",
    roleName: "Administrator",
    roleCode: "ROLE-001",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "Yesterday, 18:30 IST",
    createdAt: "2026-08-05T11:00:00Z",
    updatedAt: "2026-10-28T09:00:00Z",
  },
  {
    id: "usr-003",
    name: "Karthik Raja",
    email: "karthik.raja@iscl.org",
    contact: "+91 98450 34567",
    roleId: "role-reg-manager",
    roleName: "Registration Manager",
    roleCode: "ROLE-002",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "02 Nov 2026, 09:15 IST",
    createdAt: "2026-08-10T12:00:00Z",
    updatedAt: "2026-10-20T12:00:00Z",
  },
  {
    id: "usr-004",
    name: "Anita Desai",
    email: "anita.desai@catering.org",
    contact: "+91 98450 45678",
    roleId: "role-reg-manager",
    roleName: "Registration Manager",
    roleCode: "ROLE-002",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "01 Nov 2026, 17:00 IST",
    createdAt: "2026-08-12T14:00:00Z",
    updatedAt: "2026-10-15T11:00:00Z",
  },
  {
    id: "usr-005",
    name: "Vikram Patel",
    email: "vikram.patel@chennaikings.org",
    contact: "+91 98450 56789",
    roleId: "role-reg-manager",
    roleName: "Registration Manager",
    roleCode: "ROLE-002",
    status: "inactive",
    mustChangePassword: false,
    lastLoginAt: "28 Oct 2026, 16:45 IST",
    createdAt: "2026-08-15T09:30:00Z",
    updatedAt: "2026-10-29T14:00:00Z",
  },
  {
    id: "usr-006",
    name: "Suresh Nair",
    email: "suresh.nair@kspl.org",
    contact: "+91 98450 67890",
    roleId: "role-reg-manager",
    roleName: "Registration Manager",
    roleCode: "ROLE-002",
    status: "active",
    mustChangePassword: true,
    lastLoginAt: undefined,
    createdAt: "2026-08-18T15:20:00Z",
    updatedAt: "2026-10-18T15:20:00Z",
  },
  {
    id: "usr-007",
    name: "Rahul Verma",
    email: "rahul.verma@iscl.org",
    contact: "+91 98450 78901",
    roleId: "role-team-manager",
    roleName: "Team Manager",
    roleCode: "ROLE-003",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "Today, 11:45 IST",
    createdAt: "2026-08-20T10:10:00Z",
    updatedAt: "2026-11-03T11:45:00Z",
  },
  {
    id: "usr-008",
    name: "Deepa Krishnan",
    email: "deepa.k@tournament.org",
    contact: "+91 98450 89012",
    roleId: "role-team-manager",
    roleName: "Team Manager",
    roleCode: "ROLE-003",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "03 Nov 2026, 08:30 IST",
    createdAt: "2026-08-22T13:40:00Z",
    updatedAt: "2026-11-02T13:40:00Z",
  },
  {
    id: "usr-009",
    name: "Rohan Mehra",
    email: "rohan.mehra@jeffsgroup.org",
    contact: "+91 98450 90123",
    roleId: "role-team-manager",
    roleName: "Team Manager",
    roleCode: "ROLE-003",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "31 Oct 2026, 19:00 IST",
    createdAt: "2026-08-25T16:00:00Z",
    updatedAt: "2026-10-31T19:00:00Z",
  },
  {
    id: "usr-010",
    name: "Sneha Roy",
    email: "sneha.roy@kspl.org",
    contact: "+91 98450 01234",
    roleId: "role-team-manager",
    roleName: "Team Manager",
    roleCode: "ROLE-003",
    status: "active",
    mustChangePassword: true,
    lastLoginAt: undefined,
    createdAt: "2026-08-28T11:20:00Z",
    updatedAt: "2026-10-28T11:20:00Z",
  },
  {
    id: "usr-011",
    name: "Amit Joshi",
    email: "amit.joshi@audit.org",
    contact: "+91 98450 11223",
    roleId: "role-report-viewer",
    roleName: "Report Viewer",
    roleCode: "ROLE-004",
    status: "active",
    mustChangePassword: false,
    lastLoginAt: "02 Nov 2026, 15:30 IST",
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-10-15T15:30:00Z",
  },
  {
    id: "usr-012",
    name: "Pooja Hegde",
    email: "pooja.hegde@catering.org",
    contact: "+91 98450 22334",
    roleId: "role-report-viewer",
    roleName: "Report Viewer",
    roleCode: "ROLE-004",
    status: "inactive",
    mustChangePassword: false,
    lastLoginAt: "25 Oct 2026, 12:00 IST",
    createdAt: "2026-09-05T14:15:00Z",
    updatedAt: "2026-10-26T10:00:00Z",
  },
];
