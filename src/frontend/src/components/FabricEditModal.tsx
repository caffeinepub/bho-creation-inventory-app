import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Upload, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateFabricEntry } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { FabricEntry } from '../backend';
import { toast } from 'sonner';

const ITEM_TYPES = [
  'Fabric',
  'Thread',
  'Button',
  'Zipper',
  'Lace',
  'Other Materials',
];

const QUANTITY_UNITS = [
  'meters',
  'pieces',
  'kilograms',
  'rolls',
  'packets',
  'dozens',
  'units',
];

interface FabricEditModalProps {
  rackId: string;
  entry: FabricEntry;
  open: boolean;
  onClose: () => void;
}

export default function FabricEditModal({ rackId, entry, open, onClose }: FabricEditModalProps) {
  const [fabricName, setFabricName] = useState(entry.fabricName);
  const [itemType, setItemType] = useState(entry.itemType);
  const [unit, setUnit] = useState(entry.unit);
  const [quantity, setQuantity] = useState(entry.quantity.toString());
  const [purchaseDate, setPurchaseDate] = useState(
    entry.purchaseDate ? new Date(Number(entry.purchaseDate) / 1_000_000).toISOString().split('T')[0] : ''
  );
  const [fabricPhotoFile, setFabricPhotoFile] = useState<File | null>(null);
  const [billPhotoFile, setBillPhotoFile] = useState<File | null>(null);
  const [fabricPhotoPreview, setFabricPhotoPreview] = useState<string | null>(
    entry.fabricPhoto ? entry.fabricPhoto.getDirectURL() : null
  );
  const [billPhotoPreview, setBillPhotoPreview] = useState<string | null>(
    entry.billPhoto ? entry.billPhoto.getDirectURL() : null
  );
  const [uploadProgress, setUploadProgress] = useState<{ fabric?: number; bill?: number }>({});

  const updateMutation = useUpdateFabricEntry();

  useEffect(() => {
    if (open) {
      setFabricName(entry.fabricName);
      setItemType(entry.itemType);
      setUnit(entry.unit);
      setQuantity(entry.quantity.toString());
      setPurchaseDate(
        entry.purchaseDate ? new Date(Number(entry.purchaseDate) / 1_000_000).toISOString().split('T')[0] : ''
      );
      setFabricPhotoFile(null);
      setBillPhotoFile(null);
      setFabricPhotoPreview(entry.fabricPhoto ? entry.fabricPhoto.getDirectURL() : null);
      setBillPhotoPreview(entry.billPhoto ? entry.billPhoto.getDirectURL() : null);
      setUploadProgress({});
    }
  }, [open, entry]);

  const handleFabricPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Item photo must be less than 5MB');
        return;
      }
      setFabricPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setFabricPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBillPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Bill photo must be less than 5MB');
        return;
      }
      setBillPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setBillPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      let fabricPhotoBlob = entry.fabricPhoto;
      let billPhotoBlob = entry.billPhoto;

      if (fabricPhotoFile) {
        const arrayBuffer = await fabricPhotoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        fabricPhotoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, fabric: percentage }));
        });
      }

      if (billPhotoFile) {
        const arrayBuffer = await billPhotoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        billPhotoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, bill: percentage }));
        });
      }

      const purchaseDateBigInt = purchaseDate
        ? BigInt(new Date(purchaseDate).getTime()) * BigInt(1_000_000)
        : undefined;

      await updateMutation.mutateAsync({
        oldRackId: rackId,
        updatedData: {
          itemType,
          fabricName,
          quantity: quantityNum,
          unit,
          fabricPhoto: fabricPhotoBlob,
          purchaseDate: purchaseDateBigInt,
          billPhoto: billPhotoBlob,
        },
      });

      toast.success('Inventory item updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory item');
    }
  };

  const isUploading = uploadProgress.fabric !== undefined || uploadProgress.bill !== undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update item details, photos, and quantity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type *</Label>
            <Select value={itemType} onValueChange={setItemType} required>
              <SelectTrigger id="itemType">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="fabricName">Item Name *</Label>
            <Input
              id="fabricName"
              value={fabricName}
              onChange={(e) => setFabricName(e.target.value)}
              placeholder="e.g., Cotton Blend"
              required
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {/* Item Photo */}
          <div className="space-y-2">
            <Label htmlFor="fabricPhoto">Item Photo</Label>
            {fabricPhotoPreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img
                  src={fabricPhotoPreview}
                  alt="Item preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFabricPhotoFile(null);
                    setFabricPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="fabricPhoto"
                type="file"
                accept="image/*"
                onChange={handleFabricPhotoChange}
                className="flex-1"
              />
              <Upload className="w-5 h-5 text-neutral-400" />
            </div>
            {uploadProgress.fabric !== undefined && (
              <div className="text-sm text-amber-600">
                Uploading item photo: {uploadProgress.fabric}%
              </div>
            )}
          </div>

          {/* Bill Photo */}
          <div className="space-y-2">
            <Label htmlFor="billPhoto">Bill Photo</Label>
            {billPhotoPreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img
                  src={billPhotoPreview}
                  alt="Bill preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBillPhotoFile(null);
                    setBillPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="billPhoto"
                type="file"
                accept="image/*"
                onChange={handleBillPhotoChange}
                className="flex-1"
              />
              <Upload className="w-5 h-5 text-neutral-400" />
            </div>
            {uploadProgress.bill !== undefined && (
              <div className="text-sm text-amber-600">
                Uploading bill photo: {uploadProgress.bill}%
              </div>
            )}
          </div>

          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateMutation.error?.message || 'Failed to update inventory item'}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || isUploading}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {updateMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
