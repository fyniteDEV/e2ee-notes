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
import { useState, useEffect } from "react";
import "../App.css";
import { type Note } from "../types";
import NoteEditor from "../components/NoteEditor";
import { useAuth } from "../context/AuthProvider";
import { api } from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { accessTokenIsExpired, handleTokenRenew } from "../lib/authTools";
import AlertSnackbar from "../components/AlertSnackbar";
import { useMasterKey } from "../context/MasterKeyProvider";
import encryptionTools from "../lib/encryptionTools";

const NotePage = () => {
    const [notes, setNotes] = useState<Note[]>([
        {
            id: -1,
            title: "",
            content: "",
            created_at: new Date().toISOString(),
        },
    ]);
    const [selectedNoteId, setSelectedNoteId] = useState(-1);
    const selectedNote = notes.find((note) => note.id === selectedNoteId);

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

    // load all notes
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

        const loadAllNotes = async () => {
            setNotes(await fetchAllNotes());
        };

        handleNoAccessToken();
        loadAllNotes();
    }, []);

    useEffect(() => {
        const loadAllNotes = async () => {
            setNotes(await fetchAllNotes());
        };
        loadAllNotes();
    }, [auth.accessToken]);

    // set initial selected note to the last added one
    useEffect(() => {
        if (selectedNoteId === -1 && notes.length >= 1) {
            setSelectedNoteId(notes[notes.length - 1].id!);
        }
    }, [notes]);

    const fetchAllNotes = async () => {
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
                console.log(res.data.notes);
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

    const handleSelectNote = (id: number) => {
        setDrawerOpen(false);
        handleSaveNote();

        if (selectedNote?.title === "") {
            return setInvalidTitle(true);
        }

        if (notes.find((n) => n.id === id)) {
            setSelectedNoteId(id);
        } else {
            setSelectedNoteId(-1);
        }
    };

    const handleTitleEdit = (title: string) => {
        if (title !== "") {
            setInvalidTitle(false);
        }

        setNotes((prevNotes) =>
            prevNotes.map((n) =>
                n.id === selectedNoteId ? { ...n, title } : n
            )
        );
    };

    const handleContentEdit = (content: string) => {
        setNotes((prevNotes) =>
            prevNotes.map((n) =>
                n.id === selectedNoteId ? { ...n, content } : n
            )
        );
    };

    const handleAddNote = async () => {
        if (selectedNote?.title === "") {
            setDrawerOpen(false);
            return setInvalidTitle(true);
        }

        if (accessTokenIsExpired(auth.accessToken!)) {
            try {
                await handleTokenRenew(auth);
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
            created_at: undefined,
        };
        const payload = await encryptionTools.handleNewNote(
            newNote,
            masterKeyProvider.masterKey!
        );

        try {
            const res = await api.protected.post(
                "/api/notes",
                payload,
                auth.accessToken!
            );
            console.log("res", res.data);

            const newNote: Note = res.data.notes[0];
            setNotes((prevNotes) => [...prevNotes, newNote]);
            setSelectedNoteId(newNote.id!);
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
        console.log(selectedNoteId);
        if (selectedNoteId === -1) {
            return;
        }

        if (accessTokenIsExpired(auth.accessToken!)) {
            try {
                await handleTokenRenew(auth);
            } catch (err) {
                console.error("Unable to refresh access token:", err);
                return handleNewAlert(
                    "Unable to refresh access token. Try logging in again.",
                    "error"
                );
            }
        }

        try {
            await api.protected.put(
                "/api/notes",
                {
                    title: selectedNote?.title,
                    content: selectedNote?.content,
                    noteId: selectedNote?.id,
                },
                auth.accessToken!
            );
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
        setNotes((prevNotes) => {
            const index = prevNotes.findIndex((n) => n.id === selectedNoteId);
            const updatedNotes = prevNotes.filter(
                (n) => n.id !== selectedNoteId
            );

            if (updatedNotes.length > 0) {
                const newSelectedNote =
                    updatedNotes[index - 1] || updatedNotes[index];
                setSelectedNoteId(newSelectedNote.id!);
            } else {
                setSelectedNoteId(-1);
            }

            return updatedNotes;
        });
    };

    const handleNewAlert = (message: string, severity: "success" | "error") => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
    };

    const handleLogout = async () => {
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
                    {notes
                        .slice()
                        .reverse()
                        .map((note) => (
                            <ListItem
                                sx={{
                                    bgcolor:
                                        note.id === selectedNoteId
                                            ? "#222"
                                            : "",
                                }}
                                key={note.id}
                                disablePadding
                                onClick={() => handleSelectNote(note.id!)}
                            >
                                <ListItemButton
                                    sx={{
                                        height: 50,
                                    }}
                                >
                                    <ListItemText
                                        primary={note.title}
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
                                note={selectedNote}
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
                                note={selectedNote}
                                onTitleChange={handleTitleEdit}
                                onContentChange={handleContentEdit}
                                onDeleteButtonClick={() =>
                                    setConfirmDialogOpen(true)
                                }
                                invalidTitle={invalidTitle}
                                onSave={handleSaveNote}
                            />
                        </Box>
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
