export type Role = "family" | "caregiver" | "admin";
export type View =
  | "landing" | "auth" | "family" | "caregiver" | "admin"
  | "directory" | "toronto" | "ottawa" | "mississauga"
  | "trust" | "terms" | "privacy" | "how-it-works" | "chat";
export type AuthMode = "login" | "signup";

export interface AppUser {
  id: string;
  email: string;
  role: Role;
  full_name: string;
  verified?: boolean;
  suspended?: boolean;
  // contact
  phone?: string;
  // family profile — collected in Family onboarding questionnaire
  streetAddress?: string;
  city?: string;
  postal?: string;
  relationship?: string;
  recipientAge?: string;
  language?: string;
  services?: string[];
  mobility?: string;
  frequency?: string;
  shifts?: string[];
  budget?: string;
  // caregiver profile — collected in Caregiver onboarding questionnaire
  displayName?: string;
  pswRole?: string;
  languages?: string[];
  cities?: string[];
  hourlyRate?: string;
  careTypes?: string[];
  govId?: boolean;
  pswCert?: boolean;
  vsc?: boolean;
  firstAid?: boolean;
  cardLinked?: boolean;
}

export const MOCK_JOBS = [
  { id: "j1", title: "Daily Companion Care",        family: "The Nguyen Family",  city: "Toronto",     postal: "M5V", type: "Companion Care", hours: "4 hrs/day", days: "Mon–Fri",  rate: 22, posted: "2 days ago",  bids: 3, status: "open"   },
  { id: "j2", title: "Post-Surgery PSW Support",    family: "Chen Household",     city: "Mississauga", postal: "L5B", type: "PSW",            hours: "6 hrs/day", days: "Daily",    rate: 28, posted: "1 day ago",   bids: 1, status: "open"   },
  { id: "j3", title: "Weekend Overnight Companion", family: "The Williams Family", city: "Ottawa",      postal: "K1P", type: "Companion Care", hours: "10 hrs",    days: "Sat–Sun",  rate: 24, posted: "4 hours ago", bids: 0, status: "open"   },
  { id: "j4", title: "Morning Routine Assistance",  family: "Patel Residence",    city: "Toronto",     postal: "M6H", type: "PSW",            hours: "3 hrs/day", days: "Weekdays", rate: 26, posted: "3 days ago",  bids: 5, status: "filled" },
];

export const MOCK_TIMESHEETS = [
  { id: "t1", caregiver: "Adaeze Okafor", date: "Mon Jun 16", clockIn: "8:03 AM", clockOut: "2:14 PM", hours: 6.18, total: 135.96, fee: 20.39, status: "pending"  },
  { id: "t2", caregiver: "Adaeze Okafor", date: "Tue Jun 17", clockIn: "8:01 AM", clockOut: "2:02 PM", hours: 6.02, total: 132.44, fee: 19.87, status: "approved" },
  { id: "t3", caregiver: "Adaeze Okafor", date: "Wed Jun 18", clockIn: "7:58 AM", clockOut: "2:09 PM", hours: 6.18, total: 135.96, fee: 20.39, status: "approved" },
];

export const MOCK_SHIFTS = [
  { id: "s1", date: "Mon Jun 16", family: "The Nguyen Family", clockIn: "8:03 AM", clockOut: "2:14 PM", hours: 6.18, rate: 22, gross: 135.96, fee: 20.39, net: 115.57, status: "paid"             },
  { id: "s2", date: "Tue Jun 17", family: "The Nguyen Family", clockIn: "8:01 AM", clockOut: "2:02 PM", hours: 6.02, rate: 22, gross: 132.44, fee: 19.87, net: 112.57, status: "paid"             },
  { id: "s3", date: "Wed Jun 18", family: "The Nguyen Family", clockIn: "7:58 AM", clockOut: "2:09 PM", hours: 6.18, rate: 22, gross: 135.96, fee: 20.39, net: 115.57, status: "pending_approval" },
];

export const MOCK_CAREGIVERS = [
  { id: "c1", name: "Adaeze Okafor", city: "Toronto",     rate: 24, experience: "7 years", type: "PSW",      rating: 4.9, verified: false, suspended: false, docs: ["PSW Certificate", "Vulnerable Sector Check"]               },
  { id: "c2", name: "Maria Santos",  city: "Mississauga", rate: 22, experience: "4 years", type: "Companion", rating: 4.7, verified: false, suspended: false, docs: ["PSW Certificate"]                                           },
  { id: "c3", name: "James Abara",   city: "Ottawa",      rate: 26, experience: "9 years", type: "PSW",      rating: 5.0, verified: true,  suspended: false, docs: ["PSW Certificate", "Vulnerable Sector Check", "First Aid"] },
  { id: "c4", name: "Priya Mehta",   city: "Toronto",     rate: 23, experience: "3 years", type: "Companion", rating: 4.6, verified: false, suspended: true,  docs: ["PSW Certificate"]                                           },
];
