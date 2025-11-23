
"use client";

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';
import { useToast } from '@/hooks/use-toast';
import { User, updateProfile } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChangeAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

const predefinedAvatars = [
    "https://picsum.photos/seed/avatar1/200",
    "https://picsum.photos/seed/avatar2/200",
    "https://picsum.photos/seed/avatar3/200",
    "https://picsum.photos/seed/avatar4/200",
    "https://picsum.photos/seed/avatar5/200",
    "https://picsum.photos/seed/avatar6/200",
    "https://picsum.photos/seed/avatar7/200",
    "https://picsum.photos/seed/avatar8/200",
    "https://picsum.photos/seed/avatar9/200",
    "https://picsum.photos/seed/avatar10/200",
    "https://picsum.photos/seed/avatar11/200",
    "https://picsum.photos/seed/avatar12/200",
];


export default function ChangeAvatarDialog({ open, onOpenChange, user }: ChangeAvatarDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { firebaseApp } = useFirebase();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user.photoURL);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || !firebaseApp) return;

    setIsUploading(true);
    try {
      let finalAvatarUrl = selectedAvatar;
      
      // If the selected avatar is a data URL, it means it's a newly uploaded file.
      if (selectedAvatar.startsWith('data:image')) {
        const storage = getStorage(firebaseApp);
        const avatarRef = ref(storage, `avatars/${user.uid}/${uuidv4()}`);
        const uploadResult = await uploadString(avatarRef, selectedAvatar, 'data_url');
        finalAvatarUrl = await getDownloadURL(uploadResult.ref);
      }

      await updateProfile(user, { photoURL: finalAvatarUrl });
      
      toast({
        title: t('auth.changeAvatar.successTitle'),
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating avatar:", error);
      toast({
        variant: 'destructive',
        title: t('auth.changeAvatar.errorTitle'),
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('auth.changeAvatar.title')}</DialogTitle>
          <DialogDescription>{t('auth.changeAvatar.description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedAvatar ?? ''} />
                    <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
            </div>
            
            <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">{t('auth.changeAvatar.predefined')}</h4>
                <ScrollArea className="h-40">
                    <div className="grid grid-cols-4 gap-4 p-4">
                        {predefinedAvatars.map((avatarUrl) => (
                        <button key={avatarUrl} onClick={() => setSelectedAvatar(avatarUrl)}>
                            <Avatar className={`h-16 w-16 transition-all duration-200 ${selectedAvatar === avatarUrl ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'}`}>
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback></AvatarFallback>
                            </Avatar>
                        </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleUploadClick} disabled={isUploading}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {t('auth.changeAvatar.uploadButton')}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
                style={{ display: 'none' }}
            />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveAvatar} disabled={!selectedAvatar || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
