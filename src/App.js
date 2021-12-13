import { useEffect } from "react";
import Top from "./components/Top";

function App() {
  useEffect(() => {
    window.k.ipcRenderer.send('reactIsReady')
    window.k.receive('updater', (a, b, c, d) => console.log(a, b, c, d))
    return () => {
      window.k.ipcRenderer.removeListener('updater')
    }
  }, [])

  return <Top />
}

export default App;
