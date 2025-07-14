import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./App.css";
import RegisterPage from "./pages/RegisterPage";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

const theme = createTheme({
    palette: {
        mode: "dark",
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </ThemeProvider>
    );
}

export default App;
