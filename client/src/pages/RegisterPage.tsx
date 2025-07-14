import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Link,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

const RegisterPage = () => {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            minWidth="100vw"
        >
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="700px"
                width="450px"
                borderRadius={3}
                border={"1px #afafaf solid"}
            >
                <Stack direction={"column"} spacing={3} width={300}>
                    <Typography variant="h2">Sign Up</Typography>
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
                            // error={emailError}
                            // helperText={emailErrorMessage}
                            // color={passwordError ? 'error' : 'primary'}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="name">Username</FormLabel>
                        <TextField
                            autoComplete="name"
                            name="name"
                            required
                            fullWidth
                            id="name"
                            placeholder="johndoe77"
                            // error={nameError}
                            // helperText={nameErrorMessage}
                            // color={nameError ? "error" : "primary"}
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
                            // error={passwordError}
                            // helperText={passwordErrorMessage}
                            // color={passwordError ? "error" : "primary"}
                        />
                    </FormControl>
                    <Button variant="contained">Sign Up</Button>
                    <Typography variant="body1" sx={{ textAlign: "center" }}>
                        Already have an account? <br />
                        <Link href="#">Sign In</Link>
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
};

export default RegisterPage;
