import { Box, Typography, TextField, Stack, Button } from "@mui/material";
import "../App.css";
import { type Note } from "../types/note";
import { CloudSync, DeleteForever } from "@mui/icons-material";
import { api } from "../lib/axios";
import { useAuth } from "../AuthProvider";

interface Props {
    note: Note | undefined;
    invalidTitle: boolean;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onDeleteButtonClick: () => void;
}

const NoteEditor = ({
    note,
    invalidTitle,
    onTitleChange,
    onContentChange,
    onDeleteButtonClick,
}: Props) => {
    const auth = useAuth();

    const handleTokenRenew = async () => {
        try {
            const res = await api.get("/auth/renew");
            if (res.data.success) {
                auth.setAccessToken(res.data.accessToken);
                console.log(res.data);
                // handleSuccess();
            } else {
                // handleError(res.data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            {note ? (
                <Stack gap={3} height="100%">
                    <Box>
                        <Box display="flex" flexDirection="row" gap={3}>
                            <TextField
                                error={invalidTitle}
                                id={
                                    invalidTitle
                                        ? "outlined-error-helper-text"
                                        : ""
                                }
                                label={
                                    invalidTitle ? "Title cannot be empty" : ""
                                }
                                value={note?.title}
                                fullWidth
                                variant="standard"
                                slotProps={{
                                    htmlInput: {
                                        style: {
                                            fontSize: 24,
                                            fontWeight: "bold",
                                        },
                                    },
                                }}
                                onChange={(e) => onTitleChange(e.target.value)}
                            />
                        </Box>
                        <Typography variant="caption" mt={2}>
                            {new Date(note.createdAt).toLocaleString()}
                        </Typography>
                        <Box gap={1} display="flex" flexDirection="row">
                            <Button
                                size="small"
                                color="success"
                                loadingPosition="start"
                                startIcon={<CloudSync />}
                                variant="outlined"
                            >
                                Save
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                loadingPosition="center"
                                variant="outlined"
                                startIcon={<DeleteForever />}
                                onClick={onDeleteButtonClick}
                            >
                                Delete
                            </Button>
                            <Button
                                size="small"
                                color="info"
                                loadingPosition="center"
                                variant="outlined"
                                onClick={handleTokenRenew}
                            >
                                Renew token
                            </Button>
                        </Box>
                    </Box>
                    <Box minWidth="100%" height="100%" overflow="auto">
                        <textarea
                            name=""
                            id=""
                            className="note-content-textarea"
                            style={{
                                width: "100%",
                                height: "100%",
                                color: "currentcolor",
                                padding: "16.5px 14px",
                                margin: 0,
                                display: "block",
                                font: "inherit",
                                letterSpacing: "inherit",
                                background: "none",
                                animationName: "mui-auto-fill-cancel",
                                animationDuration: "10ms",
                                borderRadius: "5px",
                                borderWidth: "1px",
                            }}
                            value={note?.content}
                            onChange={(e) => onContentChange(e.target.value)}
                        />
                    </Box>
                </Stack>
            ) : (
                // fallback message
                <Stack gap={3}>
                    <Box>
                        <Typography variant="h6">
                            Hmm... there's nothing here...
                        </Typography>
                    </Box>
                    <Typography>
                        Press + in the menu to add a new note
                    </Typography>
                </Stack>
            )}
        </>
    );
};

export default NoteEditor;
