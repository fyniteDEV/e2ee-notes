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
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError, isAxiosError } from "axios";
import { api } from "../lib/axios";
import { type ApiResponse } from "../types";

const RegisterPage = () => {
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleRegister = async () => {
        const email = emailRef.current?.value;
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;

        if (!email || !username || !password) {
            handleError("Please fill out all fields");
            return console.error("Missing parameters");
        }

        setError(false);
        try {
            const res = await api.post("/auth/register", {
                email,
                username,
                password,
            });
            console.log(res.data);
            if (res.data.success) {
                handleSuccess();
            } else {
                handleError(res.data.message);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                console.error(err.message);
                const error: AxiosError<ApiResponse> = err;
                console.error("Failed to register:", error.response?.data);
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
        if (success) {
            const timeout = setTimeout(() => {
                navigate("/login");
            }, 3000);

            return () => clearTimeout(timeout);
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
                    <Typography variant="h2">Sign Up</Typography>
                    <Alert
                        severity="success"
                        variant="outlined"
                        sx={{
                            display: success ? "" : "none",
                        }}
                    >
                        Registration successful! Redirecting to login...
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
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="name">Username</FormLabel>
                        <TextField
                            inputRef={usernameRef}
                            autoComplete="name"
                            name="name"
                            required
                            fullWidth
                            id="name"
                            placeholder="johndoe77"
                            disabled={success}
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
                        />
                    </FormControl>
                    <Button variant="contained" onClick={handleRegister}>
                        Sign Up
                    </Button>
                    <Typography variant="body1" sx={{ textAlign: "center" }}>
                        Already have an account?
                        <br />
                        <MuiLink component={Link} to="/login">
                            Sign In
                        </MuiLink>
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
};

export default RegisterPage;
