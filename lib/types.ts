export type Product = {
  id: string;
  name: string;
  desc: string;
  subDesc: string;
  img: string;
  price: number;
};

export type AdminRole = "Owner" | "Admin";

/** Akun admin. `passwordHash` tidak pernah dikirim ke client. */
export type AdminAccount = {
  username: string;
  role: AdminRole;
  passwordHash: string;
  createdAt: string;
};

/** Bentuk akun yang aman ditampilkan ke client (tanpa hash password). */
export type PublicAdminAccount = Omit<AdminAccount, "passwordHash">;

export type SaleStatus = "Completed" | "Pending" | "Cancelled";

export type SaleRecord = {
  id: string;
  invoice: string;
  customer: string;
  product: string;
  qty: number;
  total: number;
  payment_method: string;
  status: string;
  date: string;
  updated_at?: string;
};

export type ActivityLogEntry = {
  id: string;
  username: string;
  action: string;
  timestamp: string;
};

export type SessionPayload = {
  username: string;
  role: AdminRole;
};
