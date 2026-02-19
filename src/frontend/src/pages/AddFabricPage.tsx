import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAddFabricEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

export default function AddFabricPage() {
  const navigate = useNavigate();
  const [fabricName, setFabricName] = useState('');
  const [rackId, setRackId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [fabricPhoto, setFabricPhoto] = useState<File | null>(null);
  const [fabricPhotoPreview, setFabricPhotoPreview] = useState<string | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [billPhotoPreview, setBillPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ fabric?: number; bill?: number }>({});

  const addFabricMutation = useAddFabricEntry();

  const handleFabricPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setFabricPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFabricPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBillPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setBillPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBillPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFabricPhoto = () => {
    setFabricPhoto(null);
    setFabricPhotoPreview(null);
    setUploadProgress((prev) => ({ ...prev, fabric: undefined }));
  };

  const removeBillPhoto = () => {
    setBillPhoto(null);
    setBillPhotoPreview(null);
    setUploadProgress((prev) => ({ ...prev, bill: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Validate purchase date is not in the future
    if (purchaseDate) {
      const selectedDate = new Date(purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        toast.error('Purchase date cannot be in the future');
        return;
      }
    }

    try {
      // Convert fabric photo to ExternalBlob if present
      let fabricPhotoBlob: ExternalBlob | undefined;
      if (fabricPhoto) {
        const arrayBuffer = await fabricPhoto.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        fabricPhotoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, fabric: percentage }));
        });
      }

      // Convert bill photo to ExternalBlob if present
      let billPhotoBlob: ExternalBlob | undefined;
      if (billPhoto) {
        const arrayBuffer = await billPhoto.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        billPhotoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, bill: percentage }));
        });
      }

      // Convert purchase date to bigint timestamp (nanoseconds)
      let purchaseDateTimestamp: bigint | undefined;
      if (purchaseDate) {
        const date = new Date(purchaseDate);
        purchaseDateTimestamp = BigInt(date.getTime()) * BigInt(1_000_000); // Convert ms to ns
      }

      await addFabricMutation.mutateAsync({
        fabricName,
        rackId,
        quantity: quantityNum,
        fabricPhoto: fabricPhotoBlob,
        purchaseDate: purchaseDateTimestamp,
        billPhoto: billPhotoBlob,
      });

      toast.success('Fabric entry added successfully');
      setFabricName('');
      setRackId('');
      setQuantity('');
      setPurchaseDate('');
      setFabricPhoto(null);
      setFabricPhotoPreview(null);
      setBillPhoto(null);
      setBillPhotoPreview(null);
      setUploadProgress({});
      navigate({ to: '/' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add fabric entry');
    }
  };

  const isUploading = uploadProgress.fabric !== undefined || uploadProgress.bill !== undefined;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
            Add Fabric Entry
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Register a new fabric in your inventory
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fabric Details</CardTitle>
          <CardDescription>
            Enter the fabric information and rack location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fabricName">Fabric Name / Type</Label>
              <Input
                id="fabricName"
                value={fabricName}
                onChange={(e) => setFabricName(e.target.value)}
                placeholder="e.g., Cotton Blend, Silk, Denim"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rackId">Rack ID / Barcode</Label>
              <Input
                id="rackId"
                value={rackId}
                onChange={(e) => setRackId(e.target.value)}
                placeholder="e.g., RACK-001, A1B2C3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (meters)</Label>
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
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricPhoto">Fabric Photo</Label>
              {fabricPhotoPreview ? (
                <div className="relative">
                  <img
                    src={fabricPhotoPreview}
                    alt="Fabric preview"
                    className="w-full h-48 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeFabricPhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {uploadProgress.fabric !== undefined && uploadProgress.fabric < 100 && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded px-2 py-1">
                      <div className="text-white text-xs mb-1">Uploading: {uploadProgress.fabric}%</div>
                      <div className="w-full bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadProgress.fabric}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="fabricPhoto"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-neutral-400" />
                    <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold">Click to upload</span> fabric photo
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      PNG, JPG, WEBP (MAX. 5MB)
                    </p>
                  </div>
                  <Input
                    id="fabricPhoto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFabricPhotoChange}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billPhoto">Bill / Receipt Photo</Label>
              {billPhotoPreview ? (
                <div className="relative">
                  <img
                    src={billPhotoPreview}
                    alt="Bill preview"
                    className="w-full h-48 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeBillPhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {uploadProgress.bill !== undefined && uploadProgress.bill < 100 && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded px-2 py-1">
                      <div className="text-white text-xs mb-1">Uploading: {uploadProgress.bill}%</div>
                      <div className="w-full bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadProgress.bill}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="billPhoto"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-neutral-400" />
                    <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold">Click to upload</span> bill photo
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      PNG, JPG, WEBP (MAX. 5MB)
                    </p>
                  </div>
                  <Input
                    id="billPhoto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBillPhotoChange}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                className="flex-1"
                disabled={addFabricMutation.isPending || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addFabricMutation.isPending || isUploading}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                {addFabricMutation.isPending || isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isUploading ? 'Uploading...' : 'Adding...'}
                  </>
                ) : (
                  'Add Fabric'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
