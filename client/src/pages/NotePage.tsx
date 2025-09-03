import { Add, Logout, Menu } from "@mui/icons-material";
import {
    Box,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography,
    useMediaQuery,
    useTheme,
    ListItemButton,
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    AppBar,
    Toolbar,
    Drawer,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import "../App.css";
import {
    type EncryptedNote,
    type Note,
    type NotePayload,
    type NotePreview,
} from "../types";
import NoteEditor from "../components/NoteEditor";
import { useAuth } from "../context/AuthProvider";
import { api } from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { accessTokenIsExpired, handleTokenRenew } from "../lib/authTools";
import AlertSnackbar from "../components/AlertSnackbar";
import { useMasterKey } from "../context/MasterKeyProvider";
import encryptionTools from "../lib/encryptionTools";

const NotePage = () => {
    const [notes, setNotes] = useState<EncryptedNote[]>([
        {
            id: -1,
            title: "",
            titleIV: "",
            content: "",
            contentIV: "",
            createdAt: new Date().toISOString(),
            wrappedNoteKey: "",
            noteKeyIV: "",
        },
    ]);
    const prevNotesLength = useRef(notes.length);
    const [editedNote, setEditedNote] = useState<Note>();
    const [noteEdited, setNoteEdited] = useState(false);
    const [previews, setPreviews] = useState<NotePreview[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState(-1);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const [invalidTitle, setInvalidTitle] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(
        "An unexpected error occured."
    );
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error">(
        "error"
    );

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const navigate = useNavigate();
    const auth = useAuth();
    const masterKeyProvider = useMasterKey();

    // handle access token initially
    useEffect(() => {
        const handleNoAccessToken = async () => {
            if (!auth.accessToken) {
                try {
                    await handleTokenRenew(auth);
                    const masterKey =
                        await encryptionTools.handleNoAccessTokenLogin();
                    masterKeyProvider.provideKey(masterKey);
                } catch (err) {
                    console.error("An error occured", err);
                    masterKeyProvider.clearKey();
                    navigate("/login");
                    return;
                }
            }
        };

        handleNoAccessToken();
    }, []);

    // fetch and load decrypted notes
    useEffect(() => {
        const loadAllNotes = async () => {
            const encryptedNotes = await fetchAllNotes();
            if (!encryptedNotes) {
                return;
            }

            const p = await encryptionTools.allNotesToPreviewsArray(
                encryptedNotes,
                masterKeyProvider.masterKey!
            );
            setPreviews(p);
            setNotes(encryptedNotes);
            prevNotesLength.current = encryptedNotes.length;
        };
        loadAllNotes();
    }, [masterKeyProvider.masterKey]);

    // set initial selected note to the last added one
    useEffect(() => {
        if (selectedNoteId === -1 && notes.length >= 1) {
            handleSelectNote(notes[notes.length - 1].id!);
        }
    }, [previews]);

    // on adding a note set the selected note to the newest one
    useEffect(() => {
        if (notes.length > prevNotesLength.current) {
            const newest = notes[notes.length - 1];
            console.log("newests", newest);
            handleSelectNote(newest.id!);
            prevNotesLength.current = notes.length;
        }
    }, [notes.length]);

    const fetchAllNotes = async () => {
        if (!auth.accessToken) {
            return console.warn("Couldn't fetch notes: accessToken is null");
        }

        if (accessTokenIsExpired(auth.accessToken!)) {
            try {
                await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                return navigate("/login");
            }
        }

        try {
            const res = await api.protected.get(
                "/api/notes",
                auth.accessToken!
            );
            if (res.data.success) {
                console.log("notes fetched", res.data.notes);
                return res.data.notes;
            } else {
                handleNewAlert(
                    "Unable to load notes. Please try logging in again.",
                    "error"
                );
            }
        } catch (err) {
            console.error(err);
            handleNewAlert(
                "Unable to load notes. Please try logging in again.",
                "error"
            );
        }
    };

    const handleSelectNote = async (id: number) => {
        setDrawerOpen(false);
        if (noteEdited) {
            handleSaveNote();
        }

        if (editedNote?.title === "") {
            return setInvalidTitle(true);
        }

        if (notes.find((n) => n.id === id)) {
            const decrypted = await encryptionTools.handleNoteDecryption(
                notes.find((n) => n.id === id)!,
                masterKeyProvider.masterKey!
            );
            setEditedNote(decrypted);
            setSelectedNoteId(id);
        } else {
            setSelectedNoteId(-1);
        }

        setNoteEdited(false);
    };

    const handleTitleEdit = (title: string) => {
        if (title !== "") {
            setInvalidTitle(false);
        }

        setEditedNote((prev) => (prev ? { ...prev, title } : undefined));
        setPreviews((prev) =>
            prev.map((p) => (p.id === selectedNoteId ? { ...p, title } : p))
        );

        setNoteEdited(true);
    };

    const handleContentEdit = (content: string) => {
        setEditedNote((prev) => (prev ? { ...prev, content } : undefined));
        setNoteEdited(true);
    };

    const handleAddNote = async () => {
        if (editedNote?.title === "") {
            setDrawerOpen(false);
            return setInvalidTitle(true);
        }

        let accessToken = auth.accessToken!;
        if (accessTokenIsExpired(accessToken)) {
            try {
                accessToken = await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                return handleNewAlert(
                    "Unable to refresh access token. Try logging in again.",
                    "error"
                );
            }
        }

        const newNote: Note = {
            id: undefined,
            title: "New note",
            content: "",
            createdAt: undefined,
        };
        const payload = await encryptionTools.handleNewNote(
            newNote,
            masterKeyProvider.masterKey!
        );

        try {
            const res = await api.protected.post(
                "/api/notes",
                payload,
                accessToken
            );
            const resNote: EncryptedNote = res.data.notes[0];
            setNotes((prevNotes) => [...prevNotes, resNote]);

            const preview = await encryptionTools.decryptNoteToPreview(
                resNote,
                masterKeyProvider.masterKey!
            );
            setPreviews((prevPreviews) => [...prevPreviews, preview]);
            // handleSelectNote(preview.id);
        } catch (err) {
            console.error(err);
            return handleNewAlert(
                "Failed to create new note. Try again later.",
                "error"
            );
        }

        setDrawerOpen(false);
    };

    const handleSaveNote = async () => {
        if (selectedNoteId === -1) {
            return;
        } else if (editedNote?.title === "") {
            return setInvalidTitle(true);
        }

        let accessToken = auth.accessToken!;
        if (accessTokenIsExpired(accessToken)) {
            try {
                accessToken = await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                return handleNewAlert(
                    "Unable to refresh access token. Try logging in again.",
                    "error"
                );
            }
        }

        const preSaveEncrypted = notes.find((n) => n.id === selectedNoteId);
        const encryptedNote = await encryptionTools.handleNoteEncryption(
            editedNote!,
            preSaveEncrypted!.wrappedNoteKey,
            preSaveEncrypted!.noteKeyIV,
            masterKeyProvider.masterKey!
        );

        setNotes(
            notes.map((n) => (n.id === selectedNoteId ? encryptedNote : n))
        );

        const payload: NotePayload = {
            id: encryptedNote.id!,
            title: encryptedNote.title,
            titleIV: encryptedNote.titleIV,
            content: encryptedNote.content,
            contentIV: encryptedNote.contentIV,
            noteKey: {
                wrappedNoteKey: encryptedNote.wrappedNoteKey,
                noteKeyIV: encryptedNote.noteKeyIV,
            },
        };

        try {
            await api.protected.put("/api/notes", payload, accessToken);
            handleNewAlert("Note saved", "success");
        } catch (err) {
            console.error(err);
            handleNewAlert("Failed to save note. Try again later.", "error");
        }
    };

    const handleDeleteNote = async () => {
        if (accessTokenIsExpired(auth.accessToken!)) {
            try {
                await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                setConfirmDialogOpen(false);
                handleNewAlert(
                    "Unable to refresh access token. Try logging in again.",
                    "error"
                );
                return;
            }
        }

        // send request to server
        try {
            const res = await api.protected.delete(
                `/api/notes/${selectedNoteId}`,
                auth.accessToken!
            );
            if (!res.data.success) {
                handleNewAlert(
                    "Unable to load notes. Please try logging in again.",
                    "error"
                );
            }
        } catch (err) {
            console.error(err);
            handleNewAlert(
                "Failed delete note from the server. Please try again later.",
                "error"
            );
            setConfirmDialogOpen(false);
            return;
        }

        // update on the front-end
        setConfirmDialogOpen(false);

        const updatedPreviews = previews.filter((p) => p.id !== selectedNoteId);
        setPreviews(updatedPreviews);
        const updatedNotes = notes.filter((n) => n.id !== selectedNoteId);
        setNotes(updatedNotes);

        const index = previews.findIndex((n) => n.id === selectedNoteId);
        if (updatedNotes.length > 0) {
            const newSelectedNote =
                updatedNotes[index - 1] || updatedNotes[index];
            handleSelectNote(newSelectedNote.id!);
        } else {
            handleSelectNote(-1);
        }
    };

    const handleNewAlert = (message: string, severity: "success" | "error") => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
    };

    const handleLogout = async () => {
        if (noteEdited) {
            await handleSaveNote();
        }

        if (accessTokenIsExpired(auth.accessToken!)) {
            try {
                await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                return handleNewAlert(
                    "Unable to refresh access token. Try reloading the page.",
                    "error"
                );
            }
        }

        try {
            await api.protected.post("/auth/logout", {}, auth.accessToken!);
            auth.setAccessToken(null);
            masterKeyProvider.clearKey();
            await encryptionTools.handleLogout();
            navigate("/");
        } catch (err) {
            console.error(err);
            handleNewAlert("Failed to log out. Try again later.", "error");
        }
    };

    const drawerContent = (
        <Box
            width={300}
            p={2}
            display="flex"
            flexDirection="column"
            height="100%"
        >
            {/* fixed header */}
            <Box mb={2}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Typography variant="h6">Notes</Typography>
                    <IconButton onClick={handleAddNote}>
                        <Add />
                    </IconButton>
                </Box>
                <Divider />
            </Box>

            {/* scrollable list */}
            <Box flexGrow={1} overflow="auto">
                <List>
                    {previews!
                        .slice()
                        .reverse()
                        .map((p) => (
                            <ListItem
                                sx={{
                                    bgcolor:
                                        p.id === selectedNoteId ? "#222" : "",
                                }}
                                key={p.id}
                                disablePadding
                                onClick={() => handleSelectNote(p.id!)}
                            >
                                <ListItemButton
                                    sx={{
                                        height: 50,
                                    }}
                                >
                                    <ListItemText
                                        primary={p.title}
                                        slotProps={{
                                            primary: {
                                                noWrap: true,
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                </List>
            </Box>

            {/* fixed logout footer */}
            <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Logout />}
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <>
            <Box display="flex" height="100vh" width="100vw">
                {!isMobile ? (
                    // desktop layout
                    <>
                        <Box borderRight={1} borderColor="divider">
                            {drawerContent}
                        </Box>
                        <Box p={2} flex={1}>
                            <NoteEditor
                                note={editedNote}
                                onTitleChange={handleTitleEdit}
                                onContentChange={handleContentEdit}
                                onDeleteButtonClick={() =>
                                    setConfirmDialogOpen(true)
                                }
                                invalidTitle={invalidTitle}
                                onSave={handleSaveNote}
                            />
                        </Box>
                        <AlertSnackbar
                            message={alertMessage}
                            severity={alertSeverity}
                            open={alertOpen}
                            setOpen={setAlertOpen}
                        />
                    </>
                ) : (
                    // mobile layout
                    <>
                        <AppBar position="fixed">
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    onClick={() => setDrawerOpen(true)}
                                >
                                    <Menu />
                                </IconButton>
                                <Typography variant="h6">Notes</Typography>
                            </Toolbar>
                        </AppBar>
                        <Drawer
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                        >
                            {drawerContent}
                        </Drawer>
                        <Box p={2} flex={1} mt={8}>
                            <NoteEditor
                                note={editedNote}
                                onTitleChange={handleTitleEdit}
                                onContentChange={handleContentEdit}
                                onDeleteButtonClick={() =>
                                    setConfirmDialogOpen(true)
                                }
                                invalidTitle={invalidTitle}
                                onSave={handleSaveNote}
                            />
                        </Box>
                        <AlertSnackbar
                            message={alertMessage}
                            severity={alertSeverity}
                            open={alertOpen}
                            setOpen={setAlertOpen}
                        />
                    </>
                )}
            </Box>
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>
                    Are you sure you want to permanently delete this note?
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteNote}
                        autoFocus
                        color="error"
                        variant="outlined"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default NotePage;
