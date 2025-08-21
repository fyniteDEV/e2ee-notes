import type { WrappedMasterKey } from "../types";

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const openReq = indexedDB.open("secureNotesDb", 1);

        openReq.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("encryptionData")) {
                db.createObjectStore("encryptionData");
            }
        };

        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
    });
};

export const storeDeviceKey = async (key: CryptoKey): Promise<boolean> => {
    const db: IDBDatabase = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("encryptionData", "readwrite");
        const store = transaction.objectStore("encryptionData");
        store.put(key, "KEK_device");

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getDeviceKey = async (): Promise<CryptoKey> => {
    const db: IDBDatabase = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("encryptionData", "readonly");
        const store = transaction.objectStore("encryptionData");

        const req = store.get("KEK_device");

        transaction.oncomplete = () => resolve(req.result || null);
        transaction.onerror = () => reject(transaction.error);
    });
};
export const storeWrappedMasterKey = async (
    wrappedBytes: ArrayBuffer,
    iv: Uint8Array<ArrayBuffer>
): Promise<boolean> => {
    const db: IDBDatabase = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("encryptionData", "readwrite");
        const store = transaction.objectStore("encryptionData");
        store.put({ wrapped: wrappedBytes, iv: iv }, "wrapped_master_dev");

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getWrappedMasterKey = async (): Promise<WrappedMasterKey> => {
    const db: IDBDatabase = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("encryptionData", "readonly");
        const store = transaction.objectStore("encryptionData");

        const req = store.get("wrapped_master_dev");

        transaction.oncomplete = () => {
            const result = req.result;
            if (!result || !result.wrapped || !result.iv) {
                reject(new Error("No wrapped master key or invalid format"));
                return;
            }
            resolve(result);
        };
        transaction.onerror = () => reject(transaction.error);
    });
};

export const clearKeys = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db: IDBDatabase = await openDB();
            const transaction = db.transaction("encryptionData", "readwrite");
            const store = transaction.objectStore("encryptionData");

            store.delete("KEK_device");
            store.delete("wrapped_master_dev");

            transaction.oncomplete = () => {
                console.log(
                    "Device key and wrapped master key wiped from IndexedDB"
                );
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        } catch (err) {
            reject(err);
        }
    });
};
