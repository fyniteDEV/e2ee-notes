import type { EncryptionDataBase64 } from "../types";
import {
    getDeviceKey,
    storeDeviceKey,
    getWrappedMasterKey,
    storeWrappedMasterKey,
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

export const initOnRegister = async (password: string) => {
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

// Unwrap for logging in without access token (refresh token used)
export const unwrapMasterWithDeviceKEK = async (): Promise<CryptoKey> => {
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

// TODO: wipe keys on device on logout

export default {
    initOnRegister,
    handleLogin,
    unwrapMasterWithDeviceKEK,
};
