import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerView from '../components/BarcodeScannerView';
import QuantityDeductionForm from '../components/QuantityDeductionForm';
import { useGetInventory } from '../hooks/useQueries';

export default function ScanPage() {
  const navigate = useNavigate();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const { data: inventory } = useGetInventory();

  // Find the selected entry based on selectedRackId
  const selectedEntry = useMemo(() => {
    if (!selectedRackId || !inventory) return null;
    const entry = inventory.find(([rackId]) => rackId === selectedRackId);
    return entry ? { rackId: entry[0], entry: entry[1] } : null;
  }, [selectedRackId, inventory]);

  const handleRackSelected = (scannedCode: string) => {
    if (!inventory || inventory.length === 0) {
      toast.error('Inventory is empty. Please add items first.');
      return;
    }

    // Search for matching item by name or rack ID (case-insensitive)
    const lowerScannedCode = scannedCode.toLowerCase().trim();
    const matchingEntry = inventory.find(([rackId, entry]) => {
      const fabricNameMatch = entry.fabricName.toLowerCase() === lowerScannedCode;
      const rackIdMatch = rackId.toLowerCase() === lowerScannedCode;
      return fabricNameMatch || rackIdMatch;
    });

    if (matchingEntry) {
      const [matchedRackId, matchedEntry] = matchingEntry;
      setSelectedRackId(matchedRackId);
      toast.success(`Item found: ${matchedEntry.fabricName}`);
    } else {
      toast.error(`No item found for scanned code: ${scannedCode}`);
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
          className="shrink-0 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Scan Barcode
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Scan a barcode to automatically select item and adjust quantity
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarcodeScannerView onRackSelected={handleRackSelected} />
        {selectedEntry ? (
          <QuantityDeductionForm rackId={selectedEntry.rackId} entry={selectedEntry.entry} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  No Item Selected
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Scan a barcode to select an item and adjust its quantity
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
