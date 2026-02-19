import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BarcodeScannerView from '../components/BarcodeScannerView';
import QuantityDeductionForm from '../components/QuantityDeductionForm';

export default function ScanPage() {
  const navigate = useNavigate();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

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
            Scan a rack barcode to update fabric quantity
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarcodeScannerView onRackSelected={setSelectedRackId} />
        <QuantityDeductionForm selectedRackId={selectedRackId} />
      </div>
    </div>
  );
}
