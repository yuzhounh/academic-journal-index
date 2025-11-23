
"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection, WithId } from "@/firebase/firestore/use-collection";
import {
  collection,
  query,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Journal } from "@/data/journals";
import { JournalList } from "./FavoritesContent";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking } from "@/firebase";

interface AddToFavoritesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: Journal;
  isBatchMove?: boolean;
  batchJournals?: Journal[];
  currentListId?: string;
  onSuccess?: () => void;
}

export default function AddToFavoritesDialog({
  open,
  onOpenChange,
  journal,
  isBatchMove = false,
  batchJournals = [],
  currentListId,
  onSuccess,
}: AddToFavoritesDialogProps) {
  const { user, firestore } = useFirebase();
  const { t } = useTranslation();
  const [newList, setNewList] = useState("");
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const journalsToProcess = isBatchMove ? batchJournals : [journal];
  const journalIdsToProcess = journalsToProcess.map(j => j.issn.split('/')[0]);

  const journalListsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, `users/${user.uid}/journal_lists`),
            orderBy("name", "asc")
          )
        : null,
    [user, firestore]
  );
  const { data: journalLists, setData: setJournalLists } = useCollection<JournalList>(journalListsQuery);
  
  const favoritedInQuery = useMemoFirebase(
    () =>
      user && firestore && !isBatchMove
        ? query(
            collection(firestore, `users/${user.uid}/favorite_journals`),
            where("journalId", "==", journal.issn.split('/')[0])
          )
        : null,
    [user, firestore, journal, isBatchMove]
  );
  const { data: favoritedIn, isLoading: isLoadingFavorites } = useCollection<{listId: string}>(favoritedInQuery);

  useEffect(() => {
    if (isBatchMove) {
        // For batch move, we start with no lists selected.
        setSelectedLists(new Set());
    } else if (favoritedIn) {
        // For single add, we pre-select the lists the journal is already in.
        const listIds = new Set(favoritedIn.map((fav) => fav.listId).filter(Boolean));
        setSelectedLists(listIds);
    }
  }, [favoritedIn, isBatchMove]);

  const handleCreateNewList = async () => {
    if (!newList.trim() || !user || !firestore) return;
    setIsCreating(true);

    const listName = newList.trim();
    const tempId = `temp_${Date.now()}`;
    const newListData = {
      name: listName,
      userId: user.uid,
      createdAt: new Date(), 
    };

    setJournalLists(prev => [...(prev || []), { ...newListData, id: tempId }]);
    setSelectedLists(prev => new Set(prev).add(tempId));
    setNewList("");
    setIsCreating(false);

    try {
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/journal_lists`), {
          ...newListData,
          createdAt: serverTimestamp(),
      });

      setJournalLists(prev => (prev || []).map(list => list.id === tempId ? { ...list, id: docRef.id } : list));
      setSelectedLists(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          newSet.add(docRef.id);
          return newSet;
      });

    } catch (error) {
      console.error("Error creating new list:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the new list.",
      });
      setJournalLists(prev => (prev || []).filter(list => list.id !== tempId));
      setSelectedLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !firestore) return;

    setIsSaving(true);
    
    try {
      const batch = writeBatch(firestore);

      for (const journalId of journalIdsToProcess) {
        if (isBatchMove && currentListId) {
            // MOVE logic: delete from old list
            const oldFavQuery = query(
                collection(firestore, `users/${user.uid}/favorite_journals`),
                where('journalId', '==', journalId),
                where('listId', '==', currentListId)
            );
            const oldFavs = await getDocs(oldFavQuery);
            oldFavs.forEach(doc => batch.delete(doc.ref));
        }

        // ADD logic: add to all newly selected lists
        selectedLists.forEach(listId => {
            const favoriteId = `${journalId}_${listId}`;
            const favoriteRef = doc(firestore, `users/${user.uid}/favorite_journals`, favoriteId);
            batch.set(favoriteRef, {
                journalId: journalId,
                userId: user.uid,
                listId: listId,
                createdAt: serverTimestamp(),
            });
        });

        // For single-journal "add/edit" logic (not batch move)
        if (!isBatchMove) {
          const favsQuery = query(collection(firestore, `users/${user.uid}/favorite_journals`), where('journalId', '==', journalId));
          const existingFavsSnapshot = await getDocs(favsQuery);
          const initialListIds = new Set(existingFavsSnapshot.docs.map(doc => doc.data().listId).filter(Boolean));

          const listsToRemove = new Set([...initialListIds].filter(id => !selectedLists.has(id)));
          
          existingFavsSnapshot.docs.forEach(doc => {
              const listId = doc.data().listId;
              if (listId && listsToRemove.has(listId)) {
                  batch.delete(doc.ref);
              }
          });

           // Handle adding to uncategorized if no lists are selected
          if (selectedLists.size === 0 && initialListIds.size === 0) {
            const uncategorizedFavoriteId = `${journalId}_uncategorized`;
            const favoriteRef = doc(firestore, `users/${user.uid}/favorite_journals`, uncategorizedFavoriteId);
            batch.set(favoriteRef, {
                journalId: journalId,
                userId: user.uid,
                listId: "",
                createdAt: serverTimestamp(),
            });
          } else if (selectedLists.size > 0) {
            // if it was uncategorized, remove that entry
            const uncategorizedId = `${journalId}_uncategorized`;
            const favDoc = existingFavsSnapshot.docs.find(d => d.id === uncategorizedId);
            if (favDoc) {
                batch.delete(favDoc.ref);
            }
          }
        }
      }
      
      await batch.commit();

      toast({
        title: isBatchMove ? t('batchEdit.move.successTitle') : t('favorites.dialog.saveSuccessTitle'),
        description: isBatchMove ? t('batchEdit.move.successDescription', {count: batchJournals.length}) : t('favorites.dialog.saveSuccessDescription'),
      });
      onSuccess?.(); // Callback for post-action cleanup
      onOpenChange(false);

    } catch (error) {
        console.error("Error updating favorites:", error);
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: isBatchMove ? t('batchEdit.move.errorDescription') : t('favorites.dialog.saveErrorDescription'),
        });
    } finally {
        setIsSaving(false);
    }
  };

  const onCheckedChange = (checked: boolean | "indeterminate", listId: string) => {
    setSelectedLists(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(listId);
        } else {
            newSet.delete(listId);
        }
        return newSet;
    });
  }
  
  const dialogTitle = isBatchMove 
    ? t('batchEdit.move.title', { count: batchJournals.length }) 
    : t('favorites.dialog.title');


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex gap-2">
                <Input
                    placeholder={t('favorites.dialog.newListPlaceholder')}
                    value={newList}
                    onChange={(e) => setNewList(e.target.value)}
                    disabled={isCreating}
                />
                <Button onClick={handleCreateNewList} disabled={!newList.trim() || isCreating} className="min-w-[100px]">
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('favorites.dialog.createButton')}
                </Button>
            </div>

            <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-2">
                {(journalLists || []).map((list: WithId<JournalList>) => (
                    <label 
                        key={list.id} 
                        htmlFor={list.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary cursor-pointer"
                    >
                        <Checkbox
                            id={list.id}
                            checked={selectedLists.has(list.id)}
                            onCheckedChange={(checked) => onCheckedChange(checked, list.id)}
                            disabled={isLoadingFavorites || (isBatchMove && list.id === currentListId)}
                        />
                        <span className="text-sm font-medium leading-none">
                            {list.name}
                        </span>
                    </label>
                ))}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">{t('common.cancel')}</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving} className="min-w-[100px]">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBatchMove ? t('batchEdit.move.button') : t('favorites.dialog.saveButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
