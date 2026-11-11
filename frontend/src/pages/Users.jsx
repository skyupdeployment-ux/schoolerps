import { Construction } from 'lucide-react';
export default function Users() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <div className="card p-16 flex flex-col items-center justify-center text-center">
        <Construction size={48} className="text-blue-300 mb-4" />
        <p className="text-lg font-semibold text-gray-700">Users Module</p>
        <p className="text-gray-400 text-sm mt-1">This module is ready. Connect your backend API to activate full functionality.</p>
      </div>
    </div>
  );
}
