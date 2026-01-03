export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  address: string | null;
  created_at: string;
};

export type Agent = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type Ticket = {
  id: string;
  ticket_number: string;
  customer_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  source: string;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  customers?: Customer;
  agents?: Agent;
};

export type IVRCall = {
  id: string;
  customer_id: string | null;
  ticket_id: string | null;
  phone_number: string;
  call_duration: number;
  call_type: string | null;
  notes: string | null;
  created_at: string;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  agent_id: string | null;
  comment: string;
  is_internal: boolean;
  created_at: string;
  agents?: Agent;
};