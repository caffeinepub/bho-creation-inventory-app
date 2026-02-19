import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Scan, Plus } from 'lucide-react';
import InventoryList from '../components/InventoryList';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Inventory Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your fabric stock and rack locations
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate({ to: '/add' })}
            variant="outline"
            className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Fabric
          </Button>
          <Button
            onClick={() => navigate({ to: '/scan' })}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md"
          >
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      <InventoryList />
    </div>
  );
}
