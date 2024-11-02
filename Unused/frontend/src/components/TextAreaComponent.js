import React, { useState, useEffect } from 'react';
import './TextAreaComponent.css';
import './animations.css';

function TextAreaComponent({ textAreaData, onTextAreaDataUpdate }) {
  const initialData = {
    // Part 1: Master Consent
    summary: '',
    background: '',
    numberOfParticipants: '',
    studyProcedures: '',
    alternativeProcedures: '',
    risks: '',
    benefits: '',
    costsAndCompensationToParticipants: '',
    singleIRBContact: '',
    // Part 2: Site Specific Information
    authorizationForUseOfPHI: '',
    whoToContact: '',
    researchRelatedInjury: '',
    costAndCompensation: '',
  };

  const [data, setData] = useState(textAreaData || initialData);
  const [activeField, setActiveField] = useState(null);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [aiAssistantInput, setAiAssistantInput] = useState('');

  // New state for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({
    'Part 1: Master Consent': false, // false means expanded
    'Part 2: Site Specific Information': false,
  });

  // Update local state when textAreaData prop changes
  useEffect(() => {
    setData(textAreaData);
  }, [textAreaData]);

  const handleFocus = (field) => {
    setActiveField(field);
    setAiAssistantVisible(true);
  };

  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setActiveField(null);
      setAiAssistantVisible(false);
    }
  };

  const handleAiAssistantSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: activeField,
          content: data[activeField],
          question: aiAssistantInput,
        }),
      });

      const result = await response.json();
      const newData = { ...data, [activeField]: result.content };
      setData(newData);
      onTextAreaDataUpdate(newData);
      setAiAssistantInput('');
      setAiAssistantVisible(false);
    } catch (error) {
      console.error('Error with AI assistant:', error);
    }
  };

  // Define the sections and fields
  const sections = [
    {
      title: 'Part 1: Master Consent',
      key: 'Part 1: Master Consent',
      fields: [
        { key: 'summary', label: 'Summary' },
        { key: 'background', label: 'Background' },
        { key: 'numberOfParticipants', label: 'Number of Participants' },
        { key: 'studyProcedures', label: 'Study Procedures' },
        { key: 'alternativeProcedures', label: 'Alternative Procedures' },
        { key: 'risks', label: 'Risks' },
        { key: 'benefits', label: 'Benefits' },
        { key: 'costsAndCompensationToParticipants', label: 'Costs and Compensation to Participants' },
        { key: 'singleIRBContact', label: 'Single IRB Contact' },
      ],
    },
    {
      title: 'Part 2: Site Specific Information',
      key: 'Part 2: Site Specific Information',
      fields: [
        { key: 'authorizationForUseOfPHI', label: 'Authorization for Use of Protected Health Information' },
        { key: 'whoToContact', label: 'Who to Contact' },
        { key: 'researchRelatedInjury', label: 'Research Related Injury' },
        { key: 'costAndCompensation', label: 'Cost and Compensation' },
      ],
    },
  ];

  const toggleSection = (sectionKey) => {
    setCollapsedSections((prevState) => ({
      ...prevState,
      [sectionKey]: !prevState[sectionKey],
    }));
  };

  return (
    <div className="text-area-component">
      {sections.map((section, sIndex) => (
        <div key={sIndex} className="consent-section">
          <h2 onClick={() => toggleSection(section.key)} className="collapsible-header">
            {section.title}
            <span className="toggle-icon">
              {collapsedSections[section.key] ? '+' : '-'}
            </span>
          </h2>
          {!collapsedSections[section.key] && (
            <div className="section-content">
              {section.fields.map((field, fIndex) => (
                <div key={fIndex} style={{ position: 'relative' }}>
                  <div
                    className="text-area-field"
                    onBlur={handleBlur}
                    tabIndex="-1"
                  >
                    <label>{field.label}</label>
                    <textarea
                      value={data[field.key]}
                      onFocus={() => handleFocus(field.key)}
                      onChange={(e) => {
                        const newData = { ...data, [field.key]: e.target.value };
                        setData(newData);
                        onTextAreaDataUpdate(newData);
                      }}
                    />
                  </div>
                  {/* AI Assistant Panel */}
                  {activeField === field.key && aiAssistantVisible && (
                    <div className="ai-assistant-panel">
                      <form onSubmit={handleAiAssistantSubmit}>
                        <input
                          type="text"
                          placeholder="Ask AI assistant"
                          value={aiAssistantInput}
                          onChange={(e) => setAiAssistantInput(e.target.value)}
                        />
                        <button type="submit">Submit</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TextAreaComponent;