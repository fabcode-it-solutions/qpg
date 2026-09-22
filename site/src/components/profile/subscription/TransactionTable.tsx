import { formatPrice, formatDate } from "./utils";

interface Transaction {
  id: string;
  transactionId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string;
  processedAt: string;
  responseMessage: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const statusColors = {
  completed: "text-green-400 bg-green-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  failed: "text-red-400 bg-red-400/10",
  cancelled: "text-gray-400 bg-gray-400/10",
  refunded: "text-blue-400 bg-blue-400/10",
};

const typeLabels = {
  subscription_create: "Subscription Created",
  subscription_renew: "Subscription Renewed",
  refund: "Refund",
  void: "Void",
};

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <p className="text-white/50">No payment history available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {typeLabels[transaction.type as keyof typeof typeLabels] || transaction.type}
                    </div>
                    <div className="text-sm text-white/50">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-white/40">
                      ID: {transaction.transactionId}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {formatPrice(transaction.amount, transaction.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white/70">
                    {formatDate(transaction.processedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[transaction.status as keyof typeof statusColors] || "text-gray-400 bg-gray-400/10"
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}