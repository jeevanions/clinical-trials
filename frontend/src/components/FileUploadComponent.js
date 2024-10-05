import React, { useState } from 'react';
import './FileUploadComponent.css';

function FileUploadComponent({ onFilesUploaded, onDataReceived, onTextAreaDataUpdate }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('pdf_files', file);
    });

    try {
      onFilesUploaded(); // Show loading spinner

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.body) {
        console.error('ReadableStream not supported in this browser.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Notify that data has started arriving
        if (!receivedData) {
          onDataReceived();
          receivedData = true;
        }

        let parsed = false;
        while (!parsed) {
          try {
            const jsonStr = buffer.trim();
            if (jsonStr.endsWith('}')) {
              const parsedData = JSON.parse(jsonStr);
              onTextAreaDataUpdate((prevData) => ({
                ...prevData,
                ...parsedData,
              }));
              buffer = '';
            }
            parsed = true;
          } catch (e) {
            // If JSON is incomplete, wait for more data
            parsed = true;
          }
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <div className="file-upload-component">
      {uploadedFiles && uploadedFiles.length > 0 ? (
        <div className="uploaded-files-list">
          <h3>Uploaded Files:</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      ) : (
      <div className="upload-section">
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
        />
        <button onClick={handleUpload}>Upload</button>
      </div>
  );
}

export default FileUploadComponent;