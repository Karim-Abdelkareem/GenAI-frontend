import "./App.css";
import Chat from "./Pages/Chat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Chat />
      </QueryClientProvider>
    </>
  );
}

export default App;
