import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Download,
  Refresh,
  Chat
} from '@mui/icons-material';
import { downloadConsentPdf, validateFormData } from '../services/pdfService';

function ConsentFormComponent({ selectedFiles, textAreaData, onTextAreaDataUpdate }) {
  const initialData = {
    summary: "",
    background: "",
    number_of_participants: "",
    study_procedures: "",
    alt_procedures: "",
    risks: "",
    benefits: "",
  };

  const [data, setData] = useState(textAreaData || initialData);
  const [buffer, setBuffer] = useState(textAreaData || initialData);
  const [activeField, setActiveField] = useState(null);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [aiAssistantInput, setAiAssistantInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [error, setError] = useState(null);
  
  const isGeneratedRef = useRef(false);
  const textareaRefs = useRef({});
  const processingFields = useRef(new Set());
  const bufferQueue = useRef([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const generateConsentForm = async () => {
      if (isGeneratedRef.current || !selectedFiles.length) return;
      isGeneratedRef.current = true;

      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/generate-consent-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: selectedFiles }),
        });

        if (!response.body) {
          throw new Error("ReadableStream not supported");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          try {
            const jsonData = JSON.parse(chunk);
            setStreamStarted(true);
            bufferQueue.current.push(jsonData);
            setBuffer(prevBuffer => ({
              ...prevBuffer,
              ...jsonData
            }));
          } catch (error) {
            console.error("Error parsing chunk:", error);
            console.error("Chunk:", chunk);
          }
        }
      } catch (error) {
        setError("Failed to generate consent form");
        console.error("Error generating consent form:", error);
      } finally {
        setLoading(false);
        setStreamStarted(false);
      }
    };

    generateConsentForm();
  }, [selectedFiles, BACKEND_URL]);

  const processField = async (key, content, existingContent = '') => {
    if (processingFields.current.has(key)) return;
    processingFields.current.add(key);

    try {
      const words = content.split(' ');
      let currentText = existingContent;

      for (const word of words) {
        if (!currentText.includes(word)) {
          currentText += (currentText ? ' ' : '') + word;
          setData(prev => ({
            ...prev,
            [key]: currentText
          }));
          await new Promise(r => setTimeout(r, 30));
        }
      }
    } finally {
      processingFields.current.delete(key);
    }
  };

  useEffect(() => {
    const updateFields = async () => {
      const currentBuffer = { ...buffer };
      const currentData = { ...data };
      const updatePromises = [];

      for (const key of Object.keys(initialData)) {
        if (currentBuffer[key] && currentBuffer[key] !== currentData[key]) {
          updatePromises.push(processField(key, currentBuffer[key], currentData[key]));
        }
      }

      await Promise.all(updatePromises);

      while (bufferQueue.current.length > 0) {
        const nextUpdate = bufferQueue.current.shift();
        if (nextUpdate) {
          setBuffer(prev => ({
            ...prev,
            ...nextUpdate
          }));
        }
      }
    };

    updateFields();
  }, [buffer]);

  const handleAiAssistantSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: activeField,
          content: data[activeField],
          question: aiAssistantInput,
        }),
      });

      const result = await response.json();
      if (result && result[activeField]) {
        setData(prevData => ({
          ...prevData,
          [activeField]: result[activeField],
        }));
        onTextAreaDataUpdate(prevData => ({
          ...prevData,
          [activeField]: result[activeField],
        }));
      }

      setAiAssistantInput("");
      setAiAssistantVisible(false);
    } catch (error) {
      setError("Failed to process AI assistant request");
      console.error("Error with AI assistant:", error);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Validate form data before sending
      const { isValid, errors: validationErrors } = validateFormData(data);
      if (!isValid) {
        setError("Please fill in all required fields before downloading");
        return;
      }
  
      await downloadConsentPdf(data);
    } catch (error) {
      setError(error.message || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: "Part 1: Master Consent",
      fields: [
        { key: "summary", label: "Summary" },
        { key: "background", label: "Background" },
        { key: "number_of_participants", label: "Number of Participants" },
        { key: "study_procedures", label: "Study Procedures" },
        { key: "alt_procedures", label: "Alternative Procedures" },
        { key: "risks", label: "Risks" },
        { key: "benefits", label: "Benefits" },
      ],
    }
  ];

  const hasData = Object.values(data).some(value => value !== "");

  return (
    <Box sx={{ p: 3 }}>
      {loading && !streamStarted ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {sections.map((section, sIndex) => (
            <Paper key={sIndex} elevation={2} sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                {section.title}
              </Typography>
              <Box sx={{ p: 2 }}>
                {section.fields.map((field, fIndex) => (
                  <Accordion key={fIndex} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">{field.label}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box position="relative">
                        <TextField
                          fullWidth
                          multiline
                          minRows={4}
                          value={data[field.key]}
                          onChange={(e) => {
                            const newData = {
                              ...data,
                              [field.key]: e.target.value,
                            };
                            setData(newData);
                            onTextAreaDataUpdate(newData);
                          }}
                          onFocus={() => {
                            setActiveField(field.key);
                            setAiAssistantVisible(true);
                          }}
                        />
                        {activeField === field.key && aiAssistantVisible && (
                          <Paper 
                            elevation={3} 
                            sx={{ 
                              position: 'absolute', 
                              bottom: -80, 
                              left: 0, 
                              right: 0, 
                              p: 2,
                              zIndex: 1 
                            }}
                          >
                            <Box component="form" onSubmit={handleAiAssistantSubmit} display="flex" gap={1}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Ask AI assistant"
                                value={aiAssistantInput}
                                onChange={(e) => setAiAssistantInput(e.target.value)}
                              />
                              <Button type="submit" variant="contained" startIcon={<Chat />}>
                                Ask
                              </Button>
                            </Box>
                          </Paper>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Paper>
          ))}

          {hasData && !loading && (
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleDownload}
                startIcon={<Download />}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                startIcon={<Refresh />}
              >
                Restart
              </Button>
            </Box>
          )}
        </>
      )}

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ConsentFormComponent;