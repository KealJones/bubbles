import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import BubbleChartOutlinedIcon from "@mui/icons-material/BubbleChartOutlined";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

import logo from "public/favicon.svg";
import { closeSidebar } from "./utils";
import { useTransition } from "src/utils/hooks/useTransition";
import { useAppDispatch } from "src/store/store";
import { ButtonGroup } from "@mui/joy";
import { incrementByAmount, setToAmount } from "../counter/counterSlice";
import * as autoCounter from "../autoCounter/autoCounterSlice";

export function DevToolsToggler() {
  const [open, setOpen] = React.useState(false);
  const devToolShortcutHandler = React.useCallback((event: KeyboardEvent) => {
    console.log(event.key);
    if (event.key === "D") {
      setOpen((open) => !open);
    }
  }, []);
  const [transitionRef, safeShowHide] = useTransition(open);
  React.useEffect(() => {
    document.addEventListener("keydown", devToolShortcutHandler);
    return () =>
      document.removeEventListener("keydown", devToolShortcutHandler);
  }, [devToolShortcutHandler]);
  return (
    <Box
      ref={transitionRef}
      style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      sx={{ position: "absolute", left: 0, top: 0, transition: "0.2s ease" }}
    >
      {safeShowHide && <DevTools />}
    </Box>
  );
}

export default function DevTools() {
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = React.useState(2);
  const [machineAmount, setMachineAmount] = React.useState(2);

  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        transform: {
          xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
          md: "none",
        },
        transition: "transform 0.4s, width 0.4s",
        zIndex: 10000,
        height: "100dvh",
        width: "var(--Sidebar-width)",
        top: 0,
        p: 2,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Sidebar-width": "220px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "240px",
            },
          },
        })}
      />
      <Box
        className="Sidebar-overlay"
        sx={{
          position: "fixed",
          zIndex: 9998,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          opacity: "var(--SideNavigation-slideIn)",
          backgroundColor: "var(--joy-palette-background-backdrop)",
          transition: "opacity 0.4s",
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))",
            lg: "translateX(-100%)",
          },
        }}
        onClick={() => closeSidebar()}
      />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <img
          src={`${logo}`}
          style={{ width: "20px" }}
          className="App-logo"
          alt="logo"
        />
        <Typography level="title-lg">DevTools</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>Count:</Box>
      <Input
        size="sm"
        type="number"
        startDecorator={<BubbleChartOutlinedIcon />}
        aria-label="Bubble Amount"
        value={incrementAmount}
        onChange={(e) => setIncrementAmount(Number(e.target.value))}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <ButtonGroup aria-label="outlined primary button group">
          <Button onClick={() => dispatch(incrementByAmount(incrementAmount))}>
            Add
          </Button>
          <Button
            onClick={() => dispatch(setToAmount(BigInt(incrementAmount)))}
          >
            Set
          </Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        Bubble Machines:
      </Box>
      <Input
        size="sm"
        type="number"
        startDecorator={<PrecisionManufacturingIcon />}
        aria-label="Bubble Machine Amount"
        value={machineAmount}
        onChange={(e) => setMachineAmount(Number(e.target.value))}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <ButtonGroup aria-label="outlined primary button group">
          <Button
            onClick={() =>
              dispatch(autoCounter.incrementByAmount(machineAmount))
            }
          >
            Add
          </Button>
          <Button
            onClick={() =>
              dispatch(autoCounter.setToAmount(BigInt(machineAmount)))
            }
          >
            Set
          </Button>
        </ButtonGroup>
      </Box>
      {/* <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
          },
        }}
      >
        <List
          size="sm"
          sx={{
            gap: 1,
            "--List-nestedInsetStart": "30px",
            "--ListItem-radius": (theme) => theme.vars.radius.sm,
          }}
        >
          <ListItem>
            <ListItemButton>
              <HomeRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Home</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton>
              <DashboardRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Dashboard</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected>
              <ShoppingCartRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Orders</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton
              role="menuitem"
              component="a"
              href="/joy-ui/getting-started/templates/messages/"
            >
              <QuestionAnswerRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Messages</Typography>
              </ListItemContent>
              <Chip size="sm" color="primary" variant="solid">
                4
              </Chip>
            </ListItemButton>
          </ListItem>

          <ListItem nested>
            <List sx={{ gap: 0.5 }}>
              <ListItem sx={{ mt: 0.5 }}>
                <ListItemButton
                  role="menuitem"
                  component="a"
                  href="/joy-ui/getting-started/templates/profile-dashboard/"
                >
                  My profile
                </ListItemButton>
              </ListItem>
              <ListItem>
                <ListItemButton>Create a new user</ListItemButton>
              </ListItem>
              <ListItem>
                <ListItemButton>Roles & permission</ListItemButton>
              </ListItem>
            </List>
          </ListItem>
        </List>

        <List
          size="sm"
          sx={{
            mt: "auto",
            flexGrow: 0,
            "--ListItem-radius": (theme) => theme.vars.radius.sm,
            "--List-gap": "8px",
            mb: 2,
          }}
        >
          <ListItem>
            <ListItemButton>
              <SupportRoundedIcon />
              Support
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <SettingsRoundedIcon />
              Settings
            </ListItemButton>
          </ListItem>
        </List>
        <Card
          invertedColors
          variant="soft"
          color="warning"
          size="sm"
          sx={{ boxShadow: "none" }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography level="title-sm">Used space</Typography>
            <IconButton size="sm">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Typography level="body-xs">
            Your team has used 80% of your available space. Need more?
          </Typography>
          <LinearProgress
            variant="outlined"
            value={80}
            determinate
            sx={{ my: 1 }}
          />
          <Button size="sm" variant="solid">
            Upgrade plan
          </Button>
        </Card>
      </Box>
      <Divider />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Avatar
          variant="outlined"
          size="sm"
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography level="title-sm">Siriwat K.</Typography>
          <Typography level="body-xs">siriwatk@test.com</Typography>
        </Box>
        <IconButton size="sm" variant="plain" color="neutral">
          <LogoutRoundedIcon />
        </IconButton>
      </Box> */}
    </Sheet>
  );
}
