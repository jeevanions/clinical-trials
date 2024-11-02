
import React from 'react';
import jsPDF from 'jspdf';
import './DownloadPDFComponent.css';
import './animations.css';

function DownloadPDFComponent({ textAreaData }) {
    const handleDownload = () => {
        const doc = new jsPDF();

        const keys = Object.keys(textAreaData);
        keys.forEach((key, index) => {
            doc.text(`${key}:`, 10, 10 + index * 20);
            doc.text(textAreaData[key], 10, 20 + index * 20);
        });

        doc.save('form-data.pdf');
    };

    return (
        <div className="download-pdf-component">
            <button onClick={handleDownload}>Download PDF</button>
        </div>
    );
}

export default DownloadPDFComponent;
