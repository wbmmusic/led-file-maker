import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import React, { useState } from "react";
import Preview from "./Preview";
import Export from "./Export";
import ImageOptions from "./ImageOptions";

export default function Generator() {
  const defaultExportModal = { show: false };
  const defaultErrorModal = {
    show: false,
    message: "Default Message",
    data: [],
  };
  const [files, setFiles] = useState([]);
  const [exportModal, setExportModal] = useState(defaultExportModal);
  const [format, setFormat] = useState("rgb");
  const [errorModal, setErrorModal] = useState(defaultErrorModal);
  const [imageOptions, setImageOptions] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const handleCloseExport = data => {
    console.log("Save to", exportModal.outPath);
    //console.log(data)
    setExportModal(defaultExportModal);
  };

  const isDisabled = () => {
    if (files.length > 0) return false;
    return true;
  };

  const handleExport = () => {
    window.k
      .invoke("chooseOutput")
      .then(res => {
        if (res !== "canceled") {
          //console.log(res)
          setExportModal({ show: true, outPath: res });
        }
      })
      .catch();
  };

  const makeClearImages = () => {
    if (files.length > 0) {
      return (
        <Button
          color="error"
          size="small"
          onClick={() => {
            window.k
              .invoke("clearImages")
              .then(res => setFiles(res))
              .catch(err => console.log(err));
          }}
        >
          Clear Images
        </Button>
      );
    }
  };

  const ImagesBox = () => (
    <div
      style={{
        height: "200px",
        border: "1px solid lightgrey",
        overflowY: "auto",
        fontSize: "10px",
        padding: "5px",
      }}
    >
      {files.map((file, idx) => {
        return (
          <div
            key={`fileBox${idx}`}
            style={{
              display: "inline-block",
              padding: "4px",
              margin: "2px",
              backgroundColor: "lightgrey",
              maxWidth: "100px",
              minWidth: "100px",
            }}
          >
            {file.name}
            <div>
              <img
                style={{ maxWidth: "100%", maxHeight: "100%" }}
                src={`atom://${file.name}`}
                alt={file.name}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const FormatSelect = () => (
    <div style={{ marginTop: "6px", display: "inline-block" }}>
      <div
        style={{
          paddingTop: "5px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: 170 }}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Output Type</InputLabel>
            <Select
              size="small"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={10}
              label="Output Type"
              onChange={e => console.log(e.target.value)}
            >
              <MenuItem value={10}>WBM Animation</MenuItem>
              <MenuItem value={20}>Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: 90, marginLeft: "10px" }}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Format</InputLabel>
            <Select
              size="small"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={format}
              label="Format"
              onChange={e => setFormat(e.target.value)}
            >
              <MenuItem value={"rgb"}>RGB</MenuItem>
              <MenuItem value={"rbg"}>RBG</MenuItem>
              <MenuItem value={"bgr"}>BGR</MenuItem>
              <MenuItem value={"brg"}>BRG</MenuItem>
              <MenuItem value={"grb"}>GRB</MenuItem>
              <MenuItem value={"gbr"}>GBR</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </div>
    </div>
  );

  const makeExportSection = () => {
    if (files.length > 0) {
      return (
        <div>
          <Preview
            imageOptions={imageOptions}
            pause={exportModal.show}
            style={{ width: "40px", height: "1px" }}
            files={files}
          />
          <Divider style={{ marginTop: "6px", marginBottom: "6px" }} />
          <ImagesBox />
          <Divider style={{ marginTop: "6px", marginBottom: "6px" }} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <ImageOptions setOptions={options => setImageOptions(options)} />
            <FormatSelect />
            <div style={{ marginTop: "6px" }}>
              <Button
                disabled={isDisabled()}
                onClick={handleExport}
                size="small"
                variant="contained"
              >
                Export
              </Button>
            </div>
          </div>
          <Divider style={{ marginTop: "6px", marginBottom: "6px" }} />
        </div>
      );
    }
  };

  const makeErrorModal = () => {
    if (errorModal.show === true) {
      return (
        <Modal
          open={errorModal.show}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style} component={Paper}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              ERROR
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {errorModal.message}
            </Typography>
            <div style={{ display: "inline-block" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Width</TableCell>
                    <TableCell>Height</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorModal.data.map((thing, idx) => (
                    <TableRow key={`item${idx}`}>
                      <TableCell>{thing.type}</TableCell>
                      <TableCell>{thing.width}px</TableCell>
                      <TableCell>{thing.height}px</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div style={{ textAlign: "right" }}>
              <Button onClick={() => setErrorModal(defaultErrorModal)}>
                Close
              </Button>
            </div>
          </Box>
        </Modal>
      );
    }
  };

  const SelectFolderClearButtons = () => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Button
        size="small"
        component="label"
        onClick={async () => {
          setLoadingModal(true);
          window.k
            .invoke("chooseFolder")
            .then(res => {
              if (res !== "canceled") setFiles(res);
              setLoadingModal(false);
            })
            .catch(err => {
              let error = JSON.parse(err.toString().split("':")[1]);
              console.log(error);
              setLoadingModal(false);
              setErrorModal({
                show: true,
                message: error.msg,
                data: error.data,
              });
            });
        }}
      >
        Select Folder Of Images
      </Button>
      {makeClearImages()}
    </div>
  );

  return (
    <div>
      <SelectFolderClearButtons />
      {makeExportSection()}
      <Modal
        open={exportModal.show}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} component={Paper}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Exporting...
          </Typography>
          <Export
            imageOptions={imageOptions}
            format={format}
            files={files}
            path={exportModal.outPath}
            close={handleCloseExport}
          />
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={async () => {
                await window.k.invoke("cancelExport");
                setExportModal(defaultExportModal);
              }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>
      <Modal
        open={loadingModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} component={Paper}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Loading...
          </Typography>
          <CircularProgress />
        </Box>
      </Modal>
      {makeErrorModal()}
    </div>
  );
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};
