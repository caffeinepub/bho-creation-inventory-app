import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Upload, X, Loader2 } from 'lucide-react';
import { useUpdateFabricEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { FabricEntry } from '../backend';
import { ExternalBlob } from '../backend';

interface FabricEditModalProps {
  rackId: string;
  entry: FabricEntry;
  onClose: () => void;
}

export default function FabricEditModal({ rackId, entry, onClose }: FabricEditModalProps) {
  const [itemType, setItemType] = useState(entry.itemType);
  const [fabricName, setFabricName] = useState(entry.fabricName);
  const [quantity, setQuantity] = useState(entry.quantity.toString());
  const [unit, setUnit] = useState(entry.unit);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => {
    if (entry.purchaseDate) {
      const date = new Date(Number(entry.purchaseDate) / 1_000_000);
      return date.toISOString().split('T')[0];
    }
    return '';
  });

  const [fabricPhoto, setFabricPhoto] = useState<ExternalBlob | undefined>(entry.fabricPhoto);
  const [billPhoto, setBillPhoto] = useState<ExternalBlob | undefined>(entry.billPhoto);
  const [fabricPhotoFile, setFabricPhotoFile] = useState<File | null>(null);
  const [billPhotoFile, setBillPhotoFile] = useState<File | null>(null);
  const [fabricPhotoProgress, setFabricPhotoProgress] = useState(0);
  const [billPhotoProgress, setBillPhotoProgress] = useState(0);

  const updateMutation = useUpdateFabricEntry();

  const handleFabricPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFabricPhotoFile(file);
    setFabricPhotoProgress(0);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
      setFabricPhotoProgress(percentage);
    });
    setFabricPhoto(blob);
  };

  const handleBillPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBillPhotoFile(file);
    setBillPhotoProgress(0);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
      setBillPhotoProgress(percentage);
    });
    setBillPhoto(blob);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const purchaseDateBigInt = purchaseDate
        ? BigInt(new Date(purchaseDate).getTime() * 1_000_000)
        : undefined;

      await updateMutation.mutateAsync({
        oldRackId: rackId,
        updatedData: {
          itemType,
          fabricName,
          quantity: quantityNum,
          unit,
          fabricPhoto,
          purchaseDate: purchaseDateBigInt,
          billPhoto,
        },
      });

      toast.success('Item updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the details for {entry.fabricName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger id="itemType">
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fabric">Fabric</SelectItem>
                  <SelectItem value="Thread">Thread</SelectItem>
                  <SelectItem value="Button">Button</SelectItem>
                  <SelectItem value="Zipper">Zipper</SelectItem>
                  <SelectItem value="Accessory">Accessory</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricName">Item Name</Label>
              <Input
                id="fabricName"
                value={fabricName}
                onChange={(e) => setFabricName(e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="yards">Yards</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="rolls">Rolls</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabricPhoto">Item Photo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fabricPhoto"
                type="file"
                accept="image/*"
                onChange={handleFabricPhotoChange}
                className="flex-1"
              />
              {fabricPhotoFile && fabricPhotoProgress < 100 && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{fabricPhotoProgress}%</span>
                </div>
              )}
            </div>
            {fabricPhoto && (
              <div className="relative mt-2">
                <img
                  src={fabricPhoto.getDirectURL()}
                  alt="Item preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setFabricPhoto(undefined);
                    setFabricPhotoFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billPhoto">Bill / Receipt Photo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="billPhoto"
                type="file"
                accept="image/*"
                onChange={handleBillPhotoChange}
                className="flex-1"
              />
              {billPhotoFile && billPhotoProgress < 100 && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{billPhotoProgress}%</span>
                </div>
              )}
            </div>
            {billPhoto && (
              <div className="relative mt-2">
                <img
                  src={billPhoto.getDirectURL()}
                  alt="Bill preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setBillPhoto(undefined);
                    setBillPhotoFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
