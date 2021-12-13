import { useEffect } from "react";
import Top from "./components/Top";

function App() {
  useEffect(() => {
    window.k.ipcRenderer.send('reactIsReady')
    window.k.receive('updater', (a, b, c, d) => console.log(a, b, c, d))

    window.k.receive('app_version', (event, arg) => {
      window.k.ipcRenderer.removeListener('app_version');
      document.title = 'LED File Maker --- v' + arg.version;
    });

    return () => {
      window.k.ipcRenderer.removeListener('updater')
    }
  }, [])

  return <Top />
}

export default App;
