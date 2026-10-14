import { Item, ItemInput } from "./types";

const DB_NAME = "vigio";
const DB_VERSION = 1;
const STORE = "itens";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, modo: IDBTransactionMode) {
  return db.transaction(STORE, modo).objectStore(STORE);
}

function gerarId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function listarItens(): Promise<Item[]> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readonly").getAll();
    req.onsuccess = () => resolve((req.result as Item[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function salvarItem(input: ItemInput): Promise<Item> {
  const db = await abrir();
  const item: Item = {
    ...input,
    id: gerarId(),
    criadoEm: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function atualizarItem(item: Item): Promise<Item> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function removerItem(id: string): Promise<void> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
