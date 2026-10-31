import { MantineProvider } from '@mantine/core';
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider>
    <Notifications position='top-right' zIndex={1000} />
    <App />
  </MantineProvider>
);