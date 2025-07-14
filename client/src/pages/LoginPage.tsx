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
import { Link } from "react-router-dom";

const LoginPage = () => {
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
                    <FormControl>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <TextField
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
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <TextField
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
                    <Button variant="contained">Sign In</Button>
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
