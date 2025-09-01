import type {
    EncryptedNote,
    EncryptionDataBase64,
    Note,
    NotePayload,
    NotePreview,
} from "../types";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./encoding";
import {
    getDeviceKey,
    storeDeviceKey,
    getWrappedMasterKey,
    storeWrappedMasterKey,
    clearKeys,
} from "./indexedDbHelpers";

// ## ON REGISTER ##

// Used to unlock note keys; never stored outside the memory as is, without encryption
const generateMasterKey = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        /* extractable: */ true,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
};

// Password Key Encryption Key: used to wrap the master key for storage on the server side
const generatePasswordKEK = async (
    password: string,
    iterations: number = 300000
) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Password bytes to PBKDF2 base key
    const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // Derive KEK from baseKey
    const passwordKEK = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt,
            iterations,
        },
        baseKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        ["wrapKey", "unwrapKey"]
    );

    return {
        passwordKEK,
        salt,
        kdfParams: { name: "PBKDF2", hash: "SHA-256", iterations },
    };
};

const wrapMasterWithPasswordKEK = async (
    passKEKObject: {
        passwordKEK: CryptoKey;
        salt: Uint8Array<ArrayBuffer>;
        kdfParams: { name: string; hash: string; iterations: number };
    },
    masterKey: CryptoKey
) => {
    // KEK_password
    const { passwordKEK, salt, kdfParams } = passKEKObject;

    // Create initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Wrap master key with password KEK
    const wrapped = await crypto.subtle.wrapKey("raw", masterKey, passwordKEK, {
        name: "AES-GCM",
        iv,
    });

    // Payload for sending to server
    return {
        wrappedMasterKey: uint8ArrayToBase64(new Uint8Array(wrapped)),
        kekSalt: uint8ArrayToBase64(salt),
        kdf: kdfParams,
        wrapAlgorithm: "AES-GCM",
        wrapIV: uint8ArrayToBase64(iv),
    };
};

export const handleRegister = async (password: string) => {
    const K_master = await generateMasterKey();
    console.log(K_master);
    const passKEKObject = await generatePasswordKEK(password);
    console.log(passKEKObject);
    // Send this in POST body along with credentials
    return await wrapMasterWithPasswordKEK(passKEKObject, K_master);
};

// ## ON LOGIN ##

const unwrapMasterWithPassword = async (
    encryption: EncryptionDataBase64,
    password: string
) => {
    const wrappedKey = base64ToUint8Array(encryption.wrappedMasterKey);
    const salt = base64ToUint8Array(encryption.kekSalt);
    const iv = base64ToUint8Array(encryption.wrapIV);

    // import raw password as base key
    const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: encryption.kdf.name },
        false,
        ["deriveKey"]
    );

    // derive KEK_password
    const kekPassword = await crypto.subtle.deriveKey(
        {
            name: encryption.kdf.name,
            salt,
            iterations: encryption.kdf.iterations,
            hash: encryption.kdf.hash,
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["unwrapKey"]
    );

    // unwrap wrapped_master_key
    const K_master = await crypto.subtle.unwrapKey(
        "raw",
        wrappedKey.buffer,
        kekPassword,
        { name: encryption.wrapAlgorithm, iv },
        { name: "AES-GCM", length: 256 },
        true,
        ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    );

    return K_master;
};

// Device Key Encryption Key: used to wrap the master key with on the client side
const generateDeviceKEK = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        /* extractable: */ false,
        ["wrapKey", "unwrapKey"]
    );
};

// To store the master key on the client side we wrap the master key with the
// device key
const wrapAndStoreMasterWithDeviceKEK = async (
    K_master: CryptoKey,
    KEK_device: CryptoKey
) => {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // initialization vector/nonce
    try {
        const wrapped = await crypto.subtle.wrapKey(
            "raw",
            K_master,
            KEK_device,
            {
                name: "AES-GCM",
                iv,
            }
        );
        console.log("wrapped", wrapped);
        await storeWrappedMasterKey(wrapped, iv);
        console.log("wrapped and stored");
    } catch (error) {
        console.log("error", error);
    }
};

export const handleLogin = async (
    encryption: EncryptionDataBase64,
    password: string
) => {
    const K_master = await unwrapMasterWithPassword(encryption, password);

    const KEK_device = await generateDeviceKEK();
    await storeDeviceKey(KEK_device);
    await wrapAndStoreMasterWithDeviceKEK(K_master, KEK_device);

    return K_master;
};

// Unwrap for logging in without access token (refresh token used)
export const handleNoAccessTokenLogin = async (): Promise<CryptoKey> => {
    const KEK_device = await getDeviceKey();
    if (!KEK_device) {
        throw new Error("Device key missing");
    }
    const { wrapped, iv } = await getWrappedMasterKey();

    const K_master = await crypto.subtle.unwrapKey(
        "raw",
        wrapped,
        KEK_device,
        { name: "AES-GCM", iv },
        { name: "AES-GCM", length: 256 },
        /* extractable: */ true,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );

    return K_master;
};

// ## ON LOGOUT ##

export const handleLogout = async () => {
    await clearKeys();
};

// ## NOTE KEYS ##

const generateNoteKey = async (): Promise<CryptoKey> => {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

const wrapNoteKey = async (noteKey: CryptoKey, masterKey: CryptoKey) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // console.log("note", noteKey);
    // console.log("master", masterKey);
    const wrapped = await crypto.subtle.wrapKey("raw", noteKey, masterKey, {
        name: "AES-GCM",
        iv,
    });

    return {
        wrappedNoteKey: uint8ArrayToBase64(new Uint8Array(wrapped)),
        noteKeyIV: uint8ArrayToBase64(iv),
    };
};

const unwrapNoteKey = async (
    wrappedBase64: string,
    ivBase64: string,
    masterKey: CryptoKey
): Promise<CryptoKey> => {
    const wrapped = base64ToUint8Array(wrappedBase64);
    const iv = base64ToUint8Array(ivBase64);

    return await crypto.subtle.unwrapKey(
        "raw",
        wrapped.buffer,
        masterKey,
        { name: "AES-GCM", iv },
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

const encryptNote = async (
    note: Note,
    noteKey: CryptoKey,
    wrappedNoteKey: string,
    noteKeyIV: string
): Promise<EncryptedNote> => {
    const titleIV = crypto.getRandomValues(new Uint8Array(12));
    const title = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        new TextEncoder().encode(note.title)
    );

    const contentIV = crypto.getRandomValues(new Uint8Array(12));
    const content = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: contentIV },
        noteKey,
        new TextEncoder().encode(note.content)
    );

    const encrypted: EncryptedNote = {
        ...note,
        titleIV: uint8ArrayToBase64(new Uint8Array(titleIV)),
        title: uint8ArrayToBase64(new Uint8Array(title)),
        contentIV: uint8ArrayToBase64(new Uint8Array(contentIV)),
        content: uint8ArrayToBase64(new Uint8Array(content)),
        wrappedNoteKey,
        noteKeyIV,
    };
    return encrypted;
};

const decryptNote = async (
    noteKey: CryptoKey,
    encryptedNote: EncryptedNote
): Promise<Note> => {
    const titleIV = base64ToUint8Array(encryptedNote.titleIV);
    const encryptedTitle = base64ToUint8Array(encryptedNote.title);
    const titlePlaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        encryptedTitle
    );

    const contentIV = base64ToUint8Array(encryptedNote.contentIV);
    const encryptedContent = base64ToUint8Array(encryptedNote.content);
    const contentPlaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: contentIV },
        noteKey,
        encryptedContent
    );

    const note: Note = {
        id: encryptedNote.id,
        title: new TextDecoder().decode(titlePlaintext),
        content: new TextDecoder().decode(contentPlaintext),
        createdAt: encryptedNote.createdAt,
    };
    return note;
};

export const handleNewNote = async (
    note: Note,
    masterKey: CryptoKey
): Promise<NotePayload> => {
    const noteKey = await generateNoteKey();
    const wrappedNoteKeyObj = await wrapNoteKey(noteKey, masterKey);
    const encryptedNote = await encryptNote(
        note,
        noteKey,
        wrappedNoteKeyObj.wrappedNoteKey,
        wrappedNoteKeyObj.noteKeyIV
    );

    const payload: NotePayload = {
        id: undefined,
        title: encryptedNote.title,
        titleIV: encryptedNote.titleIV,
        content: encryptedNote.content,
        contentIV: encryptedNote.contentIV,
        noteKey: wrappedNoteKeyObj,
    };
    return payload;
};

export const handleNoteEncryption = async (
    note: Note,
    wrappedNoteKeyBase64: string,
    noteKeyIVBase64: string,
    masterKey: CryptoKey
): Promise<EncryptedNote> => {
    const noteKey = await unwrapNoteKey(
        wrappedNoteKeyBase64,
        noteKeyIVBase64,
        masterKey
    );
    // const wrappedNoteKeyObj = await wrapNoteKey(noteKey, masterKey);

    const encryptedNote = await encryptNote(
        note,
        noteKey,
        wrappedNoteKeyBase64,
        noteKeyIVBase64
    );

    return encryptedNote;
};

export const handleNoteDecryption = async (
    encryptedNote: EncryptedNote,
    masterKey: CryptoKey
): Promise<Note> => {
    const noteKey = await unwrapNoteKey(
        encryptedNote.wrappedNoteKey,
        encryptedNote.noteKeyIV,
        masterKey
    );
    const note = await decryptNote(noteKey, encryptedNote);
    return note;
};

export const decryptNoteToPreview = async (
    encryptedNote: EncryptedNote,
    masterKey: CryptoKey
): Promise<NotePreview> => {
    const noteKey = await unwrapNoteKey(
        encryptedNote.wrappedNoteKey,
        encryptedNote.noteKeyIV,
        masterKey
    );
    const titleIV = base64ToUint8Array(encryptedNote.titleIV);
    const encryptedTitle = base64ToUint8Array(encryptedNote.title);
    const titlePlaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        encryptedTitle
    );

    return {
        id: encryptedNote.id!,
        title: new TextDecoder().decode(titlePlaintext),
    };
};

export const allNotesToPreviewsArray = async (
    encryptedNotes: EncryptedNote[],
    masterKey: CryptoKey
) => {
    let previews: NotePreview[] = [];

    for (let i = 0; i < encryptedNotes.length; i++) {
        const preview = await decryptNoteToPreview(
            encryptedNotes[i],
            masterKey
        );
        previews[i] = preview;
    }

    return previews;
};

export default {
    handleRegister,
    handleLogin,
    handleNoAccessTokenLogin,
    handleLogout,
    handleNewNote,
    handleNoteEncryption,
    decryptNote,
    handleNoteDecryption,
    allNotesToPreviewsArray,
    decryptNoteToPreview,
};
