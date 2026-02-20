import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, Plus, Minus } from 'lucide-react';
import { useGetInventory, useAdjustQuantity } from '../hooks/useQueries';
import { toast } from 'sonner';

interface QuantityDeductionFormProps {
  selectedRackId: string | null;
}

export default function QuantityDeductionForm({ selectedRackId }: QuantityDeductionFormProps) {
  const [operation, setOperation] = useState<'increase' | 'decrease'>('decrease');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const { data: inventory } = useGetInventory();
  const adjustQuantityMutation = useAdjustQuantity();

  const fabricEntry = selectedRackId
    ? inventory?.find(([rackId]) => rackId === selectedRackId)?.[1]
    : null;

  useEffect(() => {
    if (selectedRackId) {
      setAdjustmentAmount('');
      setOperation('decrease');
    }
  }, [selectedRackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRackId || !fabricEntry) {
      toast.error('Please scan a barcode first');
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Calculate the quantity change (positive for increase, negative for decrease)
    const quantityChange = operation === 'increase' ? amount : -amount;

    // Validate that decrease won't result in negative quantity
    if (operation === 'decrease' && amount > fabricEntry.quantity) {
      toast.error(`Cannot decrease by ${amount}m. Only ${fabricEntry.quantity}m available.`);
      return;
    }

    try {
      await adjustQuantityMutation.mutateAsync({
        rackId: selectedRackId,
        quantityChange,
      });
      
      const actionText = operation === 'increase' ? 'increased' : 'decreased';
      toast.success(`Successfully ${actionText} ${fabricEntry.fabricName} by ${amount}m`);
      setAdjustmentAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust quantity');
    }
  };

  if (!selectedRackId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              No Barcode Scanned
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Scan a barcode to view fabric details and adjust quantity
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fabricEntry) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Rack ID "{selectedRackId}" not found in inventory
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjust Fabric Quantity</CardTitle>
        <CardDescription>
          Increase or decrease the quantity for the scanned fabric
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fabric Details */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Fabric Name:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                  {fabricEntry.fabricName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Rack ID:</span>
                <code className="px-2 py-1 bg-white dark:bg-neutral-800 rounded text-sm font-mono">
                  {fabricEntry.rackId}
                </code>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Current Quantity:</span>
                <span className="font-bold text-lg text-amber-700 dark:text-amber-500">
                  {fabricEntry.quantity.toFixed(2)} m
                </span>
              </div>
            </div>
          </div>

          {/* Operation Selection */}
          <div className="space-y-3">
            <Label>Operation</Label>
            <RadioGroup value={operation} onValueChange={(value) => setOperation(value as 'increase' | 'decrease')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <span>Increase Quantity</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Minus className="w-4 h-4 text-red-600" />
                  <span>Decrease Quantity</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentAmount">
              Amount to {operation === 'increase' ? 'Add' : 'Deduct'} (meters)
            </Label>
            <Input
              id="adjustmentAmount"
              type="number"
              step="0.01"
              min="0"
              max={operation === 'decrease' ? fabricEntry.quantity : undefined}
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="e.g., 10.5"
              required
            />
            {operation === 'decrease' && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Maximum: {fabricEntry.quantity.toFixed(2)} meters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={adjustQuantityMutation.isPending}
            className={`w-full ${
              operation === 'increase'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
            } text-white`}
          >
            {adjustQuantityMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {operation === 'increase' ? (
                  <Plus className="w-4 h-4 mr-2" />
                ) : (
                  <Minus className="w-4 h-4 mr-2" />
                )}
                {operation === 'increase' ? 'Increase' : 'Decrease'} Quantity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
