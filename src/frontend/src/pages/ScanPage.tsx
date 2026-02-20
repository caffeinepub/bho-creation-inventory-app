import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerView from '../components/BarcodeScannerView';
import QuantityDeductionForm from '../components/QuantityDeductionForm';
import { useGetInventory } from '../hooks/useQueries';

export default function ScanPage() {
  const navigate = useNavigate();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const { data: inventory } = useGetInventory();

  const handleRackSelected = (scannedCode: string) => {
    if (!inventory || inventory.length === 0) {
      toast.error('Inventory is empty. Please add fabrics first.');
      return;
    }

    // Search for matching fabric by name or rack ID (case-insensitive)
    const lowerScannedCode = scannedCode.toLowerCase().trim();
    const matchingEntry = inventory.find(([rackId, entry]) => {
      const fabricNameMatch = entry.fabricName.toLowerCase() === lowerScannedCode;
      const rackIdMatch = rackId.toLowerCase() === lowerScannedCode;
      return fabricNameMatch || rackIdMatch;
    });

    if (matchingEntry) {
      const [matchedRackId, matchedEntry] = matchingEntry;
      setSelectedRackId(matchedRackId);
      toast.success(`Fabric found: ${matchedEntry.fabricName}`);
    } else {
      toast.error(`No fabric found for scanned code: ${scannedCode}`);
      setSelectedRackId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate({ to: '/' })}
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Scan Barcode
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Scan a barcode to automatically select fabric and adjust quantity
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarcodeScannerView onRackSelected={handleRackSelected} />
        <QuantityDeductionForm selectedRackId={selectedRackId} />
      </div>
    </div>
  );
}
