import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./App.css";
import RegisterPage from "./pages/RegisterPage";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import NotePage from "./pages/NotePage";
import { AuthProvider } from "./AuthProvider";

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#121212", // main background
            paper: "#1E1E1E", // cards, dialogs, etc.
        },
        primary: {
            main: "#CCCCCC", // light gray for buttons, active elements
            contrastText: "#121212",
        },
        secondary: {
            main: "#888888", // medium gray
            contrastText: "#121212",
        },
        text: {
            primary: "#E0E0E0", // almost-white text
            secondary: "#A0A0A0", // muted text
            disabled: "#555555", // low-contrast for placeholders
        },
        divider: "#2E2E2E",
        action: {
            active: "#CCCCCC",
            hover: "#2A2A2A",
            selected: "#333333",
            disabled: "#444444",
            disabledBackground: "#222222",
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: "black",
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#000000",
                    color: "#ffffff",
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <CssBaseline />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/note" element={<NotePage />} />
                </Routes>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
