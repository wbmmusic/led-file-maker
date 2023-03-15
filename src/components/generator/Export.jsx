import React, { useEffect, useState } from "react";

export default function Export({ close, format, path, imageOptions }) {
  const [frameName, setFrameName] = useState("");

  useEffect(() => {
    window.k.send("export", { format, path, imageOptions });

    window.k.receive("finishedExport", () => close());

    window.k.receive("processedFrame", data => setFrameName(data));

    return () => {
      window.k.removeListener("finishedExport");
      window.k.removeListener("processedFrame");
    };
  }, [close, format, imageOptions, path]);

  return (
    <div>
      <div>Processing {frameName}</div>
      <img
        style={{ maxWidth: "100%" }}
        src={`atom://${frameName}`}
        alt="scale"
      />
    </div>
  );
}
