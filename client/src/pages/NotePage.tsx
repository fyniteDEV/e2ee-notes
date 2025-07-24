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
import { useState } from "react";
import "../App.css";
import { type Note } from "../types/note";
import NoteEditor from "../components/NoteEditor";

const NotePage = () => {
    const [notes, setNotes] = useState<Note[]>([
        {
            id: 1,
            title: "First Note",
            content: `Iure sint delectus dicta omnis eum vero sed dolorem. Sunt quo veritatis sit voluptatem in odio. Sunt et autem exercitationem. Asperiores vel incidunt et vel sequi nihil.

Velit at est doloribus ea debitis. Quo incidunt quae eum pariatur. Accusantium exercitationem sunt et ut et. Est in et excepturi deserunt aut. Atque porro numquam quaerat id rerum et. Aut ut molestiae nemo eius odio nihil.

Aliquid ut nam expedita eligendi est laborum autem. Molestias et excepturi aut nemo eos quam. Officia dolores labore suscipit est minima voluptas dolorem distinctio. Magni dolores sapiente omnis delectus. Ducimus deserunt dolorem laborum ex et.

Praesentium quos rem reiciendis voluptate voluptatibus porro quas earum. Suscipit dolorem quibusdam aut ipsum molestiae molestiae. Quis non et adipisci qui harum. Autem aut et deleniti nam ratione voluptates amet.

Beatae molestias voluptatem est amet dolor eaque magnam et. Quas ea eum quia quo. Laborum a doloribus quis explicabo ratione odio. Ea eligendi culpa omnis vitae distinctio. Perferendis dolorem accusantium odit ad. Aut debitis nam quia ducimus similique dicta necessitatibus.
Iure sint delectus dicta omnis eum vero sed dolorem. Sunt quo veritatis sit voluptatem in odio. Sunt et autem exercitationem. Asperiores vel incidunt et vel sequi nihil.

Velit at est doloribus ea debitis. Quo incidunt quae eum pariatur. Accusantium exercitationem sunt et ut et. Est in et excepturi deserunt aut. Atque porro numquam quaerat id rerum et. Aut ut molestiae nemo eius odio nihil.

Aliquid ut nam expedita eligendi est laborum autem. Molestias et excepturi aut nemo eos quam. Officia dolores labore suscipit est minima voluptas dolorem distinctio. Magni dolores sapiente omnis delectus. Ducimus deserunt dolorem laborum ex et.

Praesentium quos rem reiciendis voluptate voluptatibus porro quas earum. Suscipit dolorem quibusdam aut ipsum molestiae molestiae. Quis non et adipisci qui harum. Autem aut et deleniti nam ratione voluptates amet.

Beatae molestias voluptatem est amet dolor eaque magnam et. Quas ea eum quia quo. Laborum a doloribus quis explicabo ratione odio. Ea eligendi culpa omnis vitae distinctio. Perferendis dolorem accusantium odit ad. Aut debitis nam quia ducimus similique dicta necessitatibus.Iure sint delectus dicta omnis eum vero sed dolorem. Sunt quo veritatis sit voluptatem in odio. Sunt et autem exercitationem. Asperiores vel incidunt et vel sequi nihil.

Velit at est doloribus ea debitis. Quo incidunt quae eum pariatur. Accusantium exercitationem sunt et ut et. Est in et excepturi deserunt aut. Atque porro numquam quaerat id rerum et. Aut ut molestiae nemo eius odio nihil.

Aliquid ut nam expedita eligendi est laborum autem. Molestias et excepturi aut nemo eos quam. Officia dolores labore suscipit est minima voluptas dolorem distinctio. Magni dolores sapiente omnis delectus. Ducimus deserunt dolorem laborum ex et.

Praesentium quos rem reiciendis voluptate voluptatibus porro quas earum. Suscipit dolorem quibusdam aut ipsum molestiae molestiae. Quis non et adipisci qui harum. Autem aut et deleniti nam ratione voluptates amet.

Beatae molestias voluptatem est amet dolor eaque magnam et. Quas ea eum quia quo. Laborum a doloribus quis explicabo ratione odio. Ea eligendi culpa omnis vitae distinctio. Perferendis dolorem accusantium odit ad. Aut debitis nam quia ducimus similique dicta necessitatibus.Iure sint delectus dicta omnis eum vero sed dolorem. Sunt quo veritatis sit voluptatem in odio. Sunt et autem exercitationem. Asperiores vel incidunt et vel sequi nihil.

Velit at est doloribus ea debitis. Quo incidunt quae eum pariatur. Accusantium exercitationem sunt et ut et. Est in et excepturi deserunt aut. Atque porro numquam quaerat id rerum et. Aut ut molestiae nemo eius odio nihil.

Aliquid ut nam expedita eligendi est laborum autem. Molestias et excepturi aut nemo eos quam. Officia dolores labore suscipit est minima voluptas dolorem distinctio. Magni dolores sapiente omnis delectus. Ducimus deserunt dolorem laborum ex et.

Praesentium quos rem reiciendis voluptate voluptatibus porro quas earum. Suscipit dolorem quibusdam aut ipsum molestiae molestiae. Quis non et adipisci qui harum. Autem aut et deleniti nam ratione voluptates amet.

Beatae molestias voluptatem est amet dolor eaque magnam et. Quas ea eum quia quo. Laborum a doloribus quis explicabo ratione odio. Ea eligendi culpa omnis vitae distinctio. Perferendis dolorem accusantium odit ad. Aut debitis nam quia ducimus similique dicta necessitatibus.`,
            createdAt: new Date().toISOString(),
        },
        {
            id: 2,
            title: "Note 2",
            content: "Fhuu very big.",
            createdAt: new Date().toISOString(),
        },
        {
            id: 3,
            title: "Damn boah",
            content: "afhasofhosaphfouiafhsahf.",
            createdAt: new Date().toISOString(),
        },
    ]);
    const [selectedNoteId, setSelectedNoteId] = useState(1);
    const selectedNote = notes.find((note) => note.id === selectedNoteId);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [invalidTitle, setInvalidTitle] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleSelectNote = (id: number) => {
        setDrawerOpen(false);
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

    const handleAddNote = () => {
        if (selectedNote?.title === "") {
            setDrawerOpen(false);
            return setInvalidTitle(true);
        }

        const newNote: Note = {
            id: Date.now(),
            title: "New Note",
            content: "",
            createdAt: new Date().toISOString(),
        };
        setNotes((prevNotes) => [...prevNotes, newNote]);
        setSelectedNoteId(newNote.id);
        setDrawerOpen(false);
    };

    const handleDeleteNote = () => {
        setConfirmDialogOpen(false);
        setNotes((prevNotes) => {
            const index = prevNotes.findIndex((n) => n.id === selectedNoteId);
            const updatedNotes = prevNotes.filter(
                (n) => n.id !== selectedNoteId
            );

            if (updatedNotes.length > 0) {
                const newSelectedNote =
                    updatedNotes[index - 1] || updatedNotes[index];
                setSelectedNoteId(newSelectedNote.id);
            } else {
                setSelectedNoteId(-1);
            }

            return updatedNotes;
        });
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
                    {notes.map((note) => (
                        <ListItem
                            sx={{
                                bgcolor:
                                    note.id === selectedNoteId ? "#222" : "",
                            }}
                            key={note.id}
                            disablePadding
                            onClick={() => handleSelectNote(note.id)}
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
                    onClick={() => {
                        console.log("Logout");
                    }}
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
                            />
                        </Box>
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
