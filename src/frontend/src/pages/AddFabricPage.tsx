import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useAddFabricEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

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

export default function AddFabricPage() {
  const navigate = useNavigate();
  const [fabricName, setFabricName] = useState('');
  const [rackId, setRackId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [itemType, setItemType] = useState('Fabric');
  const [unit, setUnit] = useState('meters');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [fabricPhoto, setFabricPhoto] = useState<File | null>(null);
  const [fabricPhotoPreview, setFabricPhotoPreview] = useState<string | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [billPhotoPreview, setBillPhotoPreview] = useState<string | null>(null);
  const [fabricUploadProgress, setFabricUploadProgress] = useState(0);
  const [billUploadProgress, setBillUploadProgress] = useState(0);

  const addFabricMutation = useAddFabricEntry();

  const handleFabricPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFabricPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFabricPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBillPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFabricPhoto = () => {
    setFabricPhoto(null);
    setFabricPhotoPreview(null);
    setFabricUploadProgress(0);
  };

  const removeBillPhoto = () => {
    setBillPhoto(null);
    setBillPhotoPreview(null);
    setBillUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fabricName || !rackId || !quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      let fabricPhotoBlob: ExternalBlob | undefined;
      let billPhotoBlob: ExternalBlob | undefined;

      if (fabricPhoto) {
        const fabricBytes = new Uint8Array(await fabricPhoto.arrayBuffer());
        fabricPhotoBlob = ExternalBlob.fromBytes(fabricBytes).withUploadProgress((percentage) => {
          setFabricUploadProgress(percentage);
        });
      }

      if (billPhoto) {
        const billBytes = new Uint8Array(await billPhoto.arrayBuffer());
        billPhotoBlob = ExternalBlob.fromBytes(billBytes).withUploadProgress((percentage) => {
          setBillUploadProgress(percentage);
        });
      }

      await addFabricMutation.mutateAsync({
        rackId,
        itemType,
        fabricName,
        quantity: quantityNum,
        unit,
        fabricPhoto: fabricPhotoBlob,
        purchaseDate: purchaseDate ? BigInt(new Date(purchaseDate).getTime()) : undefined,
        billPhoto: billPhotoBlob,
      });

      toast.success('Item added successfully!');
      navigate({ to: '/' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item');
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
            Add New Item
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Add a new item to the inventory
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            Fill in the information for the new inventory item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="itemType">Item Type *</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger id="itemType" className="min-h-[44px]">
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

              <div className="space-y-2">
                <Label htmlFor="fabricName">Item Name *</Label>
                <Input
                  id="fabricName"
                  type="text"
                  value={fabricName}
                  onChange={(e) => setFabricName(e.target.value)}
                  placeholder="Enter item name"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rackId">Rack ID *</Label>
                <Input
                  id="rackId"
                  type="text"
                  value={rackId}
                  onChange={(e) => setRackId(e.target.value)}
                  placeholder="Enter rack ID"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  step="0.01"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit" className="min-h-[44px]">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUANTITY_UNITS.map((unitOption) => (
                      <SelectItem key={unitOption} value={unitOption}>
                        {unitOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fabricPhoto">Item Photo</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('fabricPhoto')?.click()}
                    className="min-h-[44px] py-3 px-6"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  <input
                    id="fabricPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleFabricPhotoChange}
                    className="hidden"
                  />
                  {fabricPhoto && (
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {fabricPhoto.name}
                    </span>
                  )}
                </div>
                {fabricPhotoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={fabricPhotoPreview}
                      alt="Fabric preview"
                      className="w-32 h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={removeFabricPhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fabricUploadProgress > 0 && fabricUploadProgress < 100 && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${fabricUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billPhoto">Bill Photo</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('billPhoto')?.click()}
                    className="min-h-[44px] py-3 px-6"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Bill
                  </Button>
                  <input
                    id="billPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleBillPhotoChange}
                    className="hidden"
                  />
                  {billPhoto && (
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {billPhoto.name}
                    </span>
                  )}
                </div>
                {billPhotoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={billPhotoPreview}
                      alt="Bill preview"
                      className="w-32 h-32 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={removeBillPhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {billUploadProgress > 0 && billUploadProgress < 100 && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${billUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={addFabricMutation.isPending}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white min-h-[44px] py-3 px-6"
              >
                {addFabricMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                disabled={addFabricMutation.isPending}
                className="min-h-[44px] py-3 px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
