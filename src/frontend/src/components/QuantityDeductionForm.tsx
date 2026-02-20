import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, Minus, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdjustQuantity } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { FabricEntry } from '../backend';

interface QuantityDeductionFormProps {
  rackId: string;
  entry: FabricEntry;
}

export default function QuantityDeductionForm({ rackId, entry }: QuantityDeductionFormProps) {
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [operation, setOperation] = useState<'increase' | 'decrease'>('decrease');
  const adjustQuantityMutation = useAdjustQuantity();

  // Reset form when entry changes
  useEffect(() => {
    setAdjustmentAmount('');
    setOperation('decrease');
  }, [rackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Calculate the actual change (negative for decrease, positive for increase)
    const quantityChange = operation === 'decrease' ? -amount : amount;

    // Check if decrease would result in negative quantity
    if (operation === 'decrease' && amount > entry.quantity) {
      toast.error(`Cannot deduct ${amount} ${entry.unit}. Only ${entry.quantity.toFixed(2)} ${entry.unit} available.`);
      return;
    }

    try {
      await adjustQuantityMutation.mutateAsync({
        rackId,
        quantityChange,
      });

      const actionText = operation === 'decrease' ? 'deducted from' : 'added to';
      toast.success(`${amount} ${entry.unit} ${actionText} ${entry.fabricName}`);
      setAdjustmentAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust quantity');
    }
  };

  const isLowStock = entry.quantity < 10;
  const isOutOfStock = entry.quantity === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjust Quantity</CardTitle>
        <CardDescription>
          Increase or decrease the quantity for this item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Item Info */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Item Type</div>
                <Badge variant="outline" className="font-medium">
                  {entry.itemType}
                </Badge>
              </div>
              <div>
                {isOutOfStock ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : isLowStock ? (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Low Stock</Badge>
                ) : (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">In Stock</Badge>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Item Name</div>
              <div className="font-semibold text-lg">{entry.fabricName}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Rack ID</div>
              <code className="inline-block px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-sm">
                {rackId}
              </code>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Current Quantity
              </div>
              <div className="font-bold text-2xl text-amber-600 dark:text-amber-500">
                {entry.quantity.toFixed(2)} {entry.unit}
              </div>
            </div>
          </div>

          {/* Adjustment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Operation Selection */}
            <div className="space-y-3">
              <Label>Operation</Label>
              <RadioGroup value={operation} onValueChange={(value) => setOperation(value as 'increase' | 'decrease')}>
                <div className="flex items-center space-x-2 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <Label htmlFor="decrease" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Minus className="w-4 h-4 text-red-600" />
                    <span>Decrease (Deduct)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Plus className="w-4 h-4 text-green-600" />
                    <span>Increase (Add)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="adjustmentAmount">
                Quantity ({entry.unit})
              </Label>
              <Input
                id="adjustmentAmount"
                type="number"
                inputMode="numeric"
                step="0.01"
                min="0"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder={`Enter amount in ${entry.unit}`}
                required
                className="min-h-[44px]"
              />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {operation === 'decrease' 
                  ? `Maximum: ${entry.quantity.toFixed(2)} ${entry.unit}` 
                  : `Add more ${entry.unit} to inventory`}
              </p>
            </div>

            {/* Warning for low stock deduction */}
            {operation === 'decrease' && parseFloat(adjustmentAmount) > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  New quantity will be: {(entry.quantity - parseFloat(adjustmentAmount)).toFixed(2)} {entry.unit}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={adjustQuantityMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white min-h-[44px] py-3 px-6"
            >
              {adjustQuantityMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {operation === 'decrease' ? (
                    <>
                      <Minus className="w-4 h-4 mr-2" />
                      Deduct Quantity
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Quantity
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
