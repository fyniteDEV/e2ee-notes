import type { EncryptedNote, EncryptionDataBase64, Note } from "../types";
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
        ["encrypt", "decrypt"]
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
        wrappedMasterKey: btoa(String.fromCharCode(...new Uint8Array(wrapped))),
        kekSalt: btoa(String.fromCharCode(...salt)),
        kdf: kdfParams,
        wrapAlgorithm: "AES-GCM",
        wrapIV: btoa(String.fromCharCode(...iv)),
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
    // convert base64 to ArrayBuffer
    const wrappedKey = Uint8Array.from(atob(encryption.wrappedMasterKey), (c) =>
        c.charCodeAt(0)
    );
    const salt = Uint8Array.from(atob(encryption.kekSalt), (c) =>
        c.charCodeAt(0)
    );
    const iv = Uint8Array.from(atob(encryption.wrapIV), (c) => c.charCodeAt(0));

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
        // FIXME: it stores an empty object?
    } catch (error) {
        console.log("error", error);
    }
};

export const handleLogin = async (
    encryption: EncryptionDataBase64,
    password: string
) => {
    const K_master = await unwrapMasterWithPassword(encryption, password);
    console.log(K_master);

    const KEK_device = await generateDeviceKEK();
    // console.log("device key generated", KEK_device);
    await storeDeviceKey(KEK_device);
    // console.log("device key stored");
    await wrapAndStoreMasterWithDeviceKEK(K_master, KEK_device);
    // console.log("master key wrapped and stored");

    // console.log("K_MASTER", K_master);
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
        ["encrypt", "decrypt"]
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

    const wrapped = await crypto.subtle.wrapKey("raw", noteKey, masterKey, {
        name: "AES-GCM",
        iv,
    });

    return {
        wrappedNoteKeyBase64: btoa(
            String.fromCharCode(...new Uint8Array(wrapped))
        ),
        ivBase64: btoa(String.fromCharCode(...iv)),
    };
};

const unwrapNoteKey = async (
    wrappedBase64: string,
    ivBase64: string,
    masterKey: CryptoKey
): Promise<CryptoKey> => {
    const wrapped = Uint8Array.from(atob(wrappedBase64), (c) =>
        c.charCodeAt(0)
    );
    const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

    const noteKey = await crypto.subtle.unwrapKey(
        "raw",
        wrapped.buffer,
        masterKey,
        { name: "AES-GCM", iv },
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return noteKey;
};

const encryptNote = async (
    note: Note,
    noteKey: CryptoKey
): Promise<EncryptedNote> => {
    const titleIV = crypto.getRandomValues(new Uint8Array(12));
    const title = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        new TextEncoder().encode(note.title)
    );

    const contentIV = crypto.getRandomValues(new Uint8Array(12));
    const content = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        new TextEncoder().encode(note.content)
    );

    const encrypted: EncryptedNote = {
        ...note,
        title_iv: btoa(String.fromCharCode(...new Uint8Array(titleIV))),
        title: btoa(String.fromCharCode(...new Uint8Array(title))),
        content_iv: btoa(String.fromCharCode(...new Uint8Array(contentIV))),
        content: btoa(String.fromCharCode(...new Uint8Array(content))),
    };
    return encrypted;
};

const decryptNote = async (
    noteKey: CryptoKey,
    encryptedNote: EncryptedNote
): Promise<Note> => {
    const titleIV = Uint8Array.from(atob(encryptedNote.title_iv), (c) =>
        c.charCodeAt(0)
    );
    const encryptedTitle = Uint8Array.from(atob(encryptedNote.title), (c) =>
        c.charCodeAt(0)
    );
    const titlePlaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: titleIV },
        noteKey,
        encryptedTitle
    );

    const contentIV = Uint8Array.from(atob(encryptedNote.content_iv), (c) =>
        c.charCodeAt(0)
    );
    const encryptedContent = Uint8Array.from(atob(encryptedNote.content), (c) =>
        c.charCodeAt(0)
    );
    const contentPlaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: contentIV },
        noteKey,
        encryptedContent
    );

    const note: Note = {
        id: encryptedNote.id,
        title: new TextDecoder().decode(titlePlaintext),
        content: new TextDecoder().decode(contentPlaintext),
        created_at: encryptedNote.created_at,
    };
    return note;
};

export default {
    handleRegister,
    handleLogin,
    handleNoAccessTokenLogin,
    handleLogout,
};
