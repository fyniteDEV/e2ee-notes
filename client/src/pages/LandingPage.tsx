import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import bg_img from "../assets/landing_background.jpg";

const LandingPage = () => {
    return (
        <Box
            sx={{
                backgroundImage: `url(${bg_img})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "left top",
            }}
            width="100vw"
            height="100vh"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="flex-start"
        >
            <Box
                px={{ xs: 3, sm: 6, md: 10 }}
                py={{ xs: 6, sm: 8, md: 10 }}
                display="flex"
                justifyContent="center"
            >
                <Stack
                    spacing={4}
                    maxWidth="md"
                    width="100%"
                    alignItems={{ xs: "center", md: "flex-start" }}
                    textAlign={{ xs: "center", md: "left" }}
                >
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        fontSize={{ xs: "2rem", sm: "2.5rem", md: "3rem" }}
                    >
                        Your Notes. Your Eyes Only.
                    </Typography>

                    <Typography
                        variant="h5"
                        fontWeight={300}
                        fontSize={{ xs: "1.1rem", sm: "1.25rem", md: "1.5rem" }}
                        color="text.secondary"
                    >
                        No tracking, no spying. Just your thoughts, secured.
                    </Typography>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        width="100%"
                        justifyContent={{ sm: "center", md: "flex-start" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        <Button
                            component={Link}
                            to="/register"
                            variant="contained"
                            color="primary"
                            sx={{
                                width: { xs: "100%", sm: "200px" },
                                "&:hover": {
                                    backgroundColor: "primary.dark",
                                    color: "primary.contrastText",
                                    textDecoration: "none",
                                },
                            }}
                        >
                            Start app now
                        </Button>
                        {/* <Button
                            component={Link}
                            to="/about"
                            variant="outlined"
                            color="secondary"
                            sx={{
                                width: { xs: "100%", sm: "200px" },
                                "&:hover": {
                                    color: "action.active",
                                    textDecoration: "none",
                                },
                            }}
                        >
                            See how it works
                        </Button> */}
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};

export default LandingPage;
