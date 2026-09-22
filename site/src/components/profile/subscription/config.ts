import { StatusConfig } from "./types";

export const statusConfig: StatusConfig = {
  active: { color: "text-green-400", bg: "bg-green-400/10", label: "Active" },
  trial: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Trial" },
  expired: { color: "text-red-400", bg: "bg-red-400/10", label: "Expired" },
  cancelled: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "Cancelled",
  },
  pending_cancellation: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    label: "Ending Soon",
  },
  suspended: {
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    label: "Suspended",
  },
  terminated: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "Terminated",
  },
  pending: {
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    label: "Pending",
  },
  inactive: { color: "text-gray-400", bg: "bg-gray-400/10", label: "Inactive" },
};
