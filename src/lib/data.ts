export interface Meter {
  id: string;
  vendor: string;
  location: string;
  status: "active" | "inactive";
  qr: string;
  rate: number;
  totalCollected: number;
  settled: number;
  pending: number;
  transactions: number;
  mobile: string;
}

export interface Transaction {
  id: string;
  meter: string;
  vendor: string;
  amount: number;
  liters: number;
  time: string;
  status: "completed" | "failed";
  upi: string;
}

export interface Settlement {
  id: string;
  vendor: string;
  amount: number;
  commission: number;
  type: "daily" | "immediate";
  date: string;
  status: string;
}

export interface SettlementRequest {
  id: string;
  meterId: string;
  vendor: string;
  amount: number;
  commission: number;
  netAmount: number;
  date: string;
  status: "pending" | "approved";
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "vendor";
  status: "active" | "suspended";
  joined: string;
  mobile: string;
}

export const initialMeters: Meter[] = [
  { id: "MTR-001", vendor: "Ravi Enterprises", location: "Sector 12, Anantapur", status: "active", qr: "QR-A1B2C3", rate: 1, totalCollected: 48200, settled: 44500, pending: 3700, transactions: 312, mobile: "+91 98765 43210" },
  { id: "MTR-002", vendor: "Sai Water Co.", location: "Gandhi Nagar, Kurnool", status: "active", qr: "QR-D4E5F6", rate: 1, totalCollected: 31500, settled: 29000, pending: 2500, transactions: 198, mobile: "+91 87654 32109" },
  { id: "MTR-003", vendor: "Lakshmi Traders", location: "Old Town, Kadapa", status: "inactive", qr: "QR-G7H8I9", rate: 1.5, totalCollected: 12800, settled: 12800, pending: 0, transactions: 87, mobile: "+91 76543 21098" },
  { id: "MTR-004", vendor: "Balaji Water", location: "Main Road, Nellore", status: "active", qr: "QR-J0K1L2", rate: 1, totalCollected: 67300, settled: 62000, pending: 5300, transactions: 445, mobile: "+91 65432 10987" },
  { id: "MTR-005", vendor: "Tirumala Jal", location: "Hill View, Tirupati", status: "active", qr: "QR-M3N4O5", rate: 2, totalCollected: 29100, settled: 27000, pending: 2100, transactions: 221, mobile: "+91 54321 09876" },
];

export const initialTransactions: Transaction[] = [
  { id: "TXN-8821", meter: "MTR-001", vendor: "Ravi Enterprises", amount: 20, liters: 20, time: "2026-02-23 09:14", status: "completed", upi: "user1@upi" },
  { id: "TXN-8820", meter: "MTR-004", vendor: "Balaji Water", amount: 50, liters: 50, time: "2026-02-23 08:55", status: "completed", upi: "user2@upi" },
  { id: "TXN-8819", meter: "MTR-002", vendor: "Sai Water Co.", amount: 10, liters: 10, time: "2026-02-23 08:31", status: "completed", upi: "user3@upi" },
  { id: "TXN-8818", meter: "MTR-001", vendor: "Ravi Enterprises", amount: 30, liters: 30, time: "2026-02-23 08:10", status: "failed", upi: "user4@upi" },
  { id: "TXN-8817", meter: "MTR-005", vendor: "Tirumala Jal", amount: 100, liters: 100, time: "2026-02-23 07:45", status: "completed", upi: "user5@upi" },
  { id: "TXN-8816", meter: "MTR-004", vendor: "Balaji Water", amount: 20, liters: 20, time: "2026-02-22 21:10", status: "completed", upi: "user6@upi" },
  { id: "TXN-8815", meter: "MTR-003", vendor: "Lakshmi Traders", amount: 50, liters: 50, time: "2026-02-22 18:22", status: "completed", upi: "user7@upi" },
  { id: "TXN-8814", meter: "MTR-002", vendor: "Sai Water Co.", amount: 10, liters: 10, time: "2026-02-22 15:45", status: "completed", upi: "user8@upi" },
  { id: "TXN-8813", meter: "MTR-001", vendor: "Ravi Enterprises", amount: 40, liters: 40, time: "2026-02-22 12:30", status: "completed", upi: "user9@upi" },
  { id: "TXN-8812", meter: "MTR-005", vendor: "Tirumala Jal", amount: 20, liters: 10, time: "2026-02-22 11:15", status: "completed", upi: "user10@upi" },
];

export const initialSettlements: Settlement[] = [
  { id: "SET-441", vendor: "Balaji Water", amount: 62000, commission: 1265, type: "daily", date: "2026-02-22", status: "completed" },
  { id: "SET-440", vendor: "Ravi Enterprises", amount: 44500, commission: 908, type: "daily", date: "2026-02-22", status: "completed" },
  { id: "SET-439", vendor: "Sai Water Co.", amount: 5000, commission: 263, type: "immediate", date: "2026-02-21", status: "completed" },
  { id: "SET-438", vendor: "Tirumala Jal", amount: 27000, commission: 551, type: "daily", date: "2026-02-21", status: "completed" },
  { id: "SET-437", vendor: "Lakshmi Traders", amount: 12800, commission: 261, type: "daily", date: "2026-02-20", status: "completed" },
];

export const initialUsers: AppUser[] = [
  { id: "USR-001", name: "Admin User", email: "admin@smartjal.in", role: "admin", status: "active", joined: "2025-01-15", mobile: "+91 99999 00000" },
  { id: "USR-002", name: "Ravi Enterprises", email: "ravi@ravienterprises.in", role: "vendor", status: "active", joined: "2025-03-10", mobile: "+91 98765 43210" },
  { id: "USR-003", name: "Sai Water Co.", email: "sai@saiwater.in", role: "vendor", status: "active", joined: "2025-04-22", mobile: "+91 87654 32109" },
  { id: "USR-004", name: "Lakshmi Traders", email: "lakshmi@traders.in", role: "vendor", status: "suspended", joined: "2025-06-01", mobile: "+91 76543 21098" },
  { id: "USR-005", name: "Balaji Water", email: "balaji@water.in", role: "vendor", status: "active", joined: "2025-07-15", mobile: "+91 65432 10987" },
];

export const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
