import React, { useState } from 'react';
import FileUploadComponent from './components/FileUploadComponent';
import TextAreaComponent from './components/TextAreaComponent';
import DownloadPDFComponent from './components/DownloadPDFComponent';

function App() {
  const [textAreaData, setTextAreaData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFilesUploaded = () => {
    setLoading(true);
  };

  const handleDataReceived = () => {
    setLoading(false);
    setShowForm(true);
  };

  const handleTextAreaDataUpdate = (data) => {
    setTextAreaData(data);
  };

  return (
    <div className="App">
      {!showForm && (
        <FileUploadComponent
          onFilesUploaded={handleFilesUploaded}
          onDataReceived={handleDataReceived}
          onTextAreaDataUpdate={handleTextAreaDataUpdate}
        />
      )}
      {loading && <div className="loading-spinner">Loading...</div>}
      {showForm && (
        <>
          <TextAreaComponent
            textAreaData={textAreaData}
            onTextAreaDataUpdate={handleTextAreaDataUpdate}
          />
          <DownloadPDFComponent textAreaData={textAreaData} />
        </>
      )}
    </div>
  );
}

export default App;
