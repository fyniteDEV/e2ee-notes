import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

type MasterKeyContextType = {
    masterKey: CryptoKey | null;
    provideKey: (key: CryptoKey) => void;
    clearKey: () => void;
};

const MasterKeyContext = createContext<MasterKeyContextType | null>(null);

interface Props {
    children: ReactNode;
}
export const MasterKeyProvider = ({ children }: Props) => {
    const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

    const provideKey = useCallback((key: CryptoKey) => {
        setMasterKey(key);
    }, []);

    const clearKey = useCallback(() => {
        setMasterKey(null);
    }, []);

    return (
        <MasterKeyContext.Provider value={{ masterKey, provideKey, clearKey }}>
            {children}
        </MasterKeyContext.Provider>
    );
};

export const useMasterKey = () => {
    const context = useContext(MasterKeyContext);
    if (!context) {
        throw new Error("useMasterKey must be used within a MasterKeyProvider");
    }
    return context;
};
