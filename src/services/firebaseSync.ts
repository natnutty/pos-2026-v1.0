import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, Transaction, StockLog, StoreProfile, UserAccount } from '../types';
import { StorageService } from '../utils/storage';

export const FirebaseSyncService = {
  /**
   * Check if Firestore has existing menu items. If empty, seed Firestore with the local dataset.
   */
  async seedIfEmpty(): Promise<boolean> {
    try {
      const menuCol = collection(db, 'menuItems');
      const snap = await getDocs(menuCol);
      if (snap.empty) {
        // Seed default menu items
        const localMenu = StorageService.getMenuItems();
        const batch = writeBatch(db);

        localMenu.forEach((item: MenuItem) => {
          const itemRef = doc(db, 'menuItems', item.id);
          batch.set(itemRef, item);
        });

        // Store profile
        const localProfile = StorageService.getStoreProfile();
        const profileRef = doc(db, 'settings', 'storeProfile');
        batch.set(profileRef, localProfile);

        // Seed transactions if any exist in local storage
        const localTxs = StorageService.getTransactions();
        localTxs.slice(0, 100).forEach((tx: Transaction) => {
          const txRef = doc(db, 'transactions', tx.id);
          batch.set(txRef, tx);
        });

        // Seed stock logs
        const localLogs = StorageService.getStockLogs();
        localLogs.slice(0, 50).forEach((log: StockLog) => {
          const logRef = doc(db, 'stockLogs', log.id);
          batch.set(logRef, log);
        });

        // Seed user accounts
        const localUsers = StorageService.getUsers();
        localUsers.forEach((user: UserAccount) => {
          const userRef = doc(db, 'users', user.id);
          batch.set(userRef, user);
        });

        await batch.commit();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Firebase initial seed check error (fallback to local):', err);
      return false;
    }
  },

  // Save/Update MenuItem
  async setMenuItem(item: MenuItem): Promise<void> {
    try {
      const ref = doc(db, 'menuItems', item.id);
      await setDoc(ref, item, { merge: true });
    } catch (err) {
      console.error('Firebase setMenuItem error:', err);
    }
  },

  // Delete MenuItem
  async deleteMenuItem(itemId: string): Promise<void> {
    try {
      const ref = doc(db, 'menuItems', itemId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Firebase deleteMenuItem error:', err);
    }
  },

  // Save completed transaction and update item stocks atomically
  async recordTransaction(tx: Transaction, updatedItems: MenuItem[], newLogs: StockLog[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Save transaction document
      const txRef = doc(db, 'transactions', tx.id);
      batch.set(txRef, tx);

      // Update item stocks
      updatedItems.forEach((item) => {
        const itemRef = doc(db, 'menuItems', item.id);
        batch.set(itemRef, item, { merge: true });
      });

      // Save stock logs
      newLogs.forEach((log) => {
        const logRef = doc(db, 'stockLogs', log.id);
        batch.set(logRef, log);
      });

      await batch.commit();
    } catch (err) {
      console.error('Firebase recordTransaction error:', err);
    }
  },

  // Adjust stock
  async adjustStock(item: MenuItem, log: StockLog): Promise<void> {
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'menuItems', item.id);
      batch.set(itemRef, item, { merge: true });

      const logRef = doc(db, 'stockLogs', log.id);
      batch.set(logRef, log);

      await batch.commit();
    } catch (err) {
      console.error('Firebase adjustStock error:', err);
    }
  },

  // Cancel transaction
  async cancelTransaction(tx: Transaction, updatedItems?: MenuItem[], restoreLogs?: StockLog[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const txRef = doc(db, 'transactions', tx.id);
      batch.set(txRef, { status: 'cancelled' }, { merge: true });

      if (updatedItems && restoreLogs) {
        updatedItems.forEach((item) => {
          const itemRef = doc(db, 'menuItems', item.id);
          batch.set(itemRef, item, { merge: true });
        });

        restoreLogs.forEach((log) => {
          const logRef = doc(db, 'stockLogs', log.id);
          batch.set(logRef, log);
        });
      }

      await batch.commit();
    } catch (err) {
      console.error('Firebase cancelTransaction error:', err);
    }
  },

  // Update store profile
  async saveStoreProfile(profile: StoreProfile): Promise<void> {
    try {
      const ref = doc(db, 'settings', 'storeProfile');
      await setDoc(ref, profile, { merge: true });
    } catch (err) {
      console.error('Firebase saveStoreProfile error:', err);
    }
  },

  // Real-time listener for Menu Items
  subscribeMenuItems(onUpdate: (items: MenuItem[]) => void): () => void {
    const col = collection(db, 'menuItems');
    return onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: MenuItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as MenuItem);
          });
          onUpdate(items);
        }
      },
      (err) => {
        console.warn('Snapshot menuItems listener warning:', err);
      }
    );
  },

  // Real-time listener for Transactions
  subscribeTransactions(onUpdate: (transactions: Transaction[]) => void): () => void {
    const col = collection(db, 'transactions');
    const q = query(col, orderBy('timestamp', 'desc'), limit(250));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const txs: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            txs.push(docSnap.data() as Transaction);
          });
          onUpdate(txs);
        }
      },
      (err) => {
        console.warn('Snapshot transactions listener warning:', err);
      }
    );
  },

  // Real-time listener for Store Profile
  subscribeStoreProfile(onUpdate: (profile: StoreProfile) => void): () => void {
    const ref = doc(db, 'settings', 'storeProfile');
    return onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as StoreProfile);
        }
      },
      (err) => {
        console.warn('Snapshot storeProfile listener warning:', err);
      }
    );
  },
};
