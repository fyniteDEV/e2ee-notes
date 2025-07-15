import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { AxiosError, isAxiosError } from "axios";
import { api, type ApiError } from "../lib/axios";

const RegisterPage = () => {
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleRegister = async () => {
        const email = emailRef.current?.value;
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;

        if (!email || !username || !password) {
            // TODO: show error to the user
            return console.error("Missing parameters");
        }

        try {
            const res = await api.post("/auth/register", {
                email,
                username,
                password,
            });
            console.log(res.data);
        } catch (err) {
            if (isAxiosError(err)) {
                const error: AxiosError<ApiError> = err;
                console.error("Failed to register:", error.response?.data);
            }
        }
    };

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
