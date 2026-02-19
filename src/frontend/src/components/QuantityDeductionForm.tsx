import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, Minus } from 'lucide-react';
import { useGetInventory, useUpdateFabricQuantity } from '../hooks/useQueries';
import { toast } from 'sonner';

interface QuantityDeductionFormProps {
  selectedRackId: string | null;
}

export default function QuantityDeductionForm({ selectedRackId }: QuantityDeductionFormProps) {
  const [usedQuantity, setUsedQuantity] = useState('');
  const { data: inventory } = useGetInventory();
  const updateQuantityMutation = useUpdateFabricQuantity();

  const fabricEntry = selectedRackId
    ? inventory?.find(([rackId]) => rackId === selectedRackId)?.[1]
    : null;

  useEffect(() => {
    if (selectedRackId) {
      setUsedQuantity('');
    }
  }, [selectedRackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRackId || !fabricEntry) {
      toast.error('Please scan a barcode first');
      return;
    }

    const quantity = parseFloat(usedQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (quantity > fabricEntry.quantity) {
      toast.error(`Cannot deduct ${quantity}m. Only ${fabricEntry.quantity}m available.`);
      return;
    }

    try {
      await updateQuantityMutation.mutateAsync({
        rackId: selectedRackId,
        usedQuantity: quantity,
      });
      toast.success(`Successfully deducted ${quantity}m from ${fabricEntry.fabricName}`);
      setUsedQuantity('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quantity');
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
              Scan a rack barcode to view fabric details and update quantity
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
        <CardTitle>Deduct Fabric Quantity</CardTitle>
        <CardDescription>
          Update the quantity for the scanned rack
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
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Available:</span>
                <span className="font-bold text-lg text-amber-700 dark:text-amber-500">
                  {fabricEntry.quantity.toFixed(2)} m
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="usedQuantity">Quantity to Deduct (meters)</Label>
            <Input
              id="usedQuantity"
              type="number"
              step="0.01"
              min="0"
              max={fabricEntry.quantity}
              value={usedQuantity}
              onChange={(e) => setUsedQuantity(e.target.value)}
              placeholder="e.g., 10.5"
              required
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Maximum: {fabricEntry.quantity.toFixed(2)} meters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={updateQuantityMutation.isPending}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          >
            {updateQuantityMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Minus className="w-4 h-4 mr-2" />
                Deduct Quantity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
