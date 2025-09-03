import {
    Alert,
    Box,
    Button,
    FormControl,
    FormLabel,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AxiosError, isAxiosError } from "axios";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthProvider";
import { type ApiResponse, type LoginSrvResponse } from "../types";
import encryptionTools from "../lib/encryptionTools";
import { useMasterKey } from "../context/MasterKeyProvider";

const LoginPage = () => {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const auth = useAuth();
    const masterKeyProvider = useMasterKey();

    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;

        if (!email || !password) {
            handleError("Please fill out all fields");
            return console.error("Missing parameters");
        }

        try {
            const res = await api.post("/auth/login", {
                email,
                password,
            });

            const srvRes: LoginSrvResponse = res.data;
            if (srvRes.success) {
                // console.log(srvRes);
                auth.setAccessToken(srvRes.accessToken!);

                const masterKey = await encryptionTools.handleLogin(
                    srvRes.encryption!,
                    password
                );
                masterKeyProvider.provideKey(masterKey);

                handleSuccess();
            } else {
                handleError(srvRes.message);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                const error: AxiosError<ApiResponse> = err;
                console.error("Failed to sign in:", error.response?.data);
                handleError(error.response?.data.message || err.message);
            } else {
                handleError("An unexpected error occured");
            }
        }
    };

    const handleSuccess = () => {
        setSuccess(true);
        setError(false);
    };

    const handleError = (message: string) => {
        setSuccess(false);
        setError(true);
        setErrorMessage(message);
    };

    useEffect(() => {
        if (success && auth.accessToken !== null) {
            navigate("/note");
        }
    }, [success]);

    return (
        <Box
            width="100vw"
            minHeight="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                padding={8}
                borderRadius={3}
                border={"1px #afafaf solid"}
                sx={{ backgroundColor: "#0f0f0f" }}
            >
                <Stack direction={"column"} spacing={3} width={300}>
                    <Typography variant="h2">Sign In</Typography>
                    <Alert
                        severity="success"
                        variant="outlined"
                        sx={{
                            display: success ? "" : "none",
                        }}
                    >
                        Login successful
                    </Alert>
                    <Alert
                        severity="error"
                        variant="outlined"
                        sx={{
                            display: error ? "" : "none",
                        }}
                    >
                        {errorMessage}
                    </Alert>
                    <FormControl>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <TextField
                            inputRef={emailRef}
                            required
                            fullWidth
                            id="email"
                            placeholder="email@example.com"
                            name="email"
                            autoComplete="email"
                            variant="outlined"
                            disabled={success}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <TextField
                            inputRef={passwordRef}
                            required
                            fullWidth
                            name="password"
                            placeholder="•••••••••"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            variant="outlined"
                            disabled={success}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <Button variant="contained" onClick={handleLogin}>
                        Sign In
                    </Button>
                    <Typography variant="body1" sx={{ textAlign: "center" }}>
                        Don't have an account yet?
                        <br />
                        <MuiLink component={Link} to="/register">
                            Sign Up
                        </MuiLink>
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
};

export default LoginPage;
