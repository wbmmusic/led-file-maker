import { useEffect } from "react";
import Top from "./components/Top";

function App() {
  useEffect(() => {
    window.k.ipcRenderer.send('reactIsReady')
    window.k.receive('updater', (e, data) => console.log(data))
    return () => {
      window.k.ipcRenderer.removeListener('updater')
    }
  }, [])

  return <Top />
}

export default App;
