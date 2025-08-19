import {
    getDeviceKey,
    storeDeviceKey,
    getWrappedMasterKey,
    storeWrappedMasterKey,
} from "./indexedDbHelpers";

// Device Key Encryption Key: used to wrap the master key with on the client side
const generateDeviceKEK = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        /* extractable: */ false,
        ["wrapKey", "unwrapKey"]
    );
};

// Used to unlock note keys; never stored outside the memory as is, without encryption
const generateMasterKey = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        /* extractable: */ true,
        ["encrypt", "decrypt"]
    );
};

// To store the master key on the client side we wrap the master key with the
// device key
const wrapMasterWithDeviceKEK = async (
    K_master: CryptoKey,
    KEK_device: CryptoKey
) => {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // initialization vector/nonce
    const wrapped = await crypto.subtle.wrapKey("raw", K_master, KEK_device, {
        name: "AES-GCM",
        iv,
    });
    await storeWrappedMasterKey(wrapped, iv);
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

// TODO: only generate master key with password KEK wrapping and
// send that to the server with the user credentials on registration.
// On login the wrapped master key is fetched, unwrapped, new device key is
// generated and with that the master key is wrapped and stored.
export const initOnRegister = async (password: string) => {
    // const KEK_device = await generateDeviceKEK();

    // await storeDeviceKey(KEK_device);
    // await wrapMasterWithDeviceKEK(K_master, KEK_device);

    const K_master = await generateMasterKey();
    console.log(K_master);
    const passKEKObject = await generatePasswordKEK(password);
    console.log(passKEKObject);
    // Send this in POST body along with credentials
    return await wrapMasterWithPasswordKEK(passKEKObject, K_master);
};

// Unwrap for logging in
const unwrapMasterWithDeviceKEK = async (): Promise<CryptoKey> => {
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
