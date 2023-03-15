import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import React, { Fragment, useEffect, useState } from "react";

const Preview = ({ files, pause, imageOptions }) => {
  const [state, setState] = useState(0);

  const makeSize = () => {
    if (files.length > 0) {
      return (
        <Fragment>
          <Box sx={{ marginLeft: "10px" }}>
            Frames: <b>{files.length}</b>
          </Box>
          <Box sx={{ marginLeft: "10px" }}>
            Width: <b>{files[0].width}</b>px
          </Box>
          <Box sx={{ marginLeft: "10px" }}>
            Height: <b>{files[0].height}</b>px
          </Box>
        </Fragment>
      );
    }
  };

  useEffect(() => {
    let timer;
    if (!pause) {
      timer = setInterval(() => {
        setState(old => {
          if (old >= files.length - 1) return 0;
          else return old + 1;
        });
      }, 33);
    }

    return () => clearInterval(timer);
  }, [files, pause]);

  if (files.length <= 0 || !imageOptions) return <div></div>;

  const handleOptions = () => {
    let out = "";
    if (imageOptions.flip.horizontal) out = out + "scaleY(-1)";
    if (imageOptions.flip.vertical) out = out + "scaleX(-1)";
    return { transform: out };
  };

  return (
    <Box
      style={{ padding: "8px", backgroundColor: "lightgray" }}
      component={Paper}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <b>Preview</b>
        <div
          style={{
            display: "inline-block",
            marginLeft: "6px",
            fontSize: "12px",
            width: "40px",
            textAlign: "center",
          }}
        >
          {state}
        </div>
        {makeSize()}
      </div>
      <Divider style={{ marginBottom: "6px" }} />
      <img
        style={{ maxWidth: "100%", ...handleOptions() }}
        src={"atom://" + files[state].name}
        alt={files[state].name}
      />
      <div style={{ height: "6px" }} />
      <img
        style={{
          width: "300px",
          border: "10px solid white",
          ...handleOptions(),
        }}
        src={"atom://" + files[state].name}
        alt={files[state].name}
      />
    </Box>
  );
};

export default Preview;
