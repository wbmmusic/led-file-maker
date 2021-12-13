import { useEffect } from "react";
import Top from "./components/Top";

function App() {
  useEffect(() => {
    window.k.ipcRenderer.send('reactIsReady')
    window.k.receive('updater', (a, b) => {
      if (a === 'checking-for-update') console.log("Checking For Update")
      else if (a === 'update-not-available') console.log("Up to date: v", b.version)
      else if (a === 'update-available') console.log("Update available", "Ver " + b.version)
      else if (a === 'download-progress') console.log("Downloading", Math.round(b.percent) + "%")
      else if (a === 'update-downloaded') console.log("Downloaded", b)
      else if (a === 'error') console.log("Update Error", b)
      else console.log(a, b)
    })

    window.k.receive('app_version', (event, arg) => {
      document.title = 'LED File Maker --- v' + arg.version;
    });

    return () => {
      window.k.removeListener('updater')
      window.k.removeListener('app_version');
    }
  }, [])

  return <Top />
}

export default App;
