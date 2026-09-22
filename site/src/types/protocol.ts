export interface Protocol {
  id: number;
  category: string;
  title: string;
  content: string;
  tags: string[] | null;
  priority: number | null;
}

export interface ProtocolsResponse {
  success: boolean;
  data?: Protocol[];
  error?: string;
}