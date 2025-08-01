import { Alert, Snackbar, type SnackbarCloseReason } from "@mui/material";

interface Props {
    message: string;
    severity: "success" | "error";
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AlertSnackbar = ({ message, severity, open, setOpen }: Props) => {
    const handleClose = (
        _: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason
    ) => {
        if (reason === "clickaway") {
            return;
        }
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert
                onClose={handleClose}
                severity={severity}
                variant="filled"
                sx={{ width: "100%" }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default AlertSnackbar;
