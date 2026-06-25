import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import UploadDisclosure from './UploadDisclosure';
import ValidationHistory from './ValidationHistory';
import DisclosureDetailsPage from './pages/DisclosureDetailsPage';
import Feedback from './Feedback';
import { DisclosuresProvider } from './context/DisclosuresContext';
import RegulatorLiveFeed from './pages/regulator/LiveFeed';
import RegulatorReview from './pages/regulator/Review';
import EntityMaster from './pages/regulator/EntityMaster';
import Profile from './Profile';
import apiService from './services/api';
import { AgentProvider } from './context/AgentContext';
import AgentPicker from './pages/AgentPicker';
import AnalyzerDashboard from './pages/analyzer/AnalyzerDashboard';
import InsightAgent from './pages/analyzer/InsightAgent';
import AnalysisHistory from './pages/analyzer/AnalysisHistory';
import AnalyzerKnowledgeCenter from './pages/analyzer/AnalyzerKnowledgeCenter';

// Sample SEBI Regulations Data - Updated links
const regulationsData = [
  {
    id: 1,
    title: 'Securities and Exchange Board of India (Listing Obligations and Disclosure Requirements) Regulations, 2015 [Last amended on September 08, 2025]',
    category: 'Listing Obligations',
    description: 'Listing Obligations and Disclosure Requirements for all listed entities',
    date: '2015-09-02',
    lastAmended: '2025-09-08',
    keywords: ['listing', 'disclosure', 'corporate governance', 'lodr'],
    events: [
      {
        id: 1,
        name: 'Credit Ratings',
        description: 'Disclosures related to credit ratings of listed entities',
        category: 'Disclosure',
        keywords: ['credit rating', 'CRA', 'rating agency', 'disclosure'],
        regulations: [
          {
            id: 1,
            typeOfEntity: 'Listed entity (wherever applicable)',
            regulation: 'Regulation 8',
            requirement: 'General Obligation / Cooperation',
            text: 'The listed entity shall co-operate with and submit correct and adequate information to intermediaries registered with the Board, such as credit rating agencies, within specified timelines and procedures.',
            format: 'N/A',
            validationCheck: '',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 2,
            typeOfEntity: 'Listed entity with listed specified securities',
            regulation: 'Regulation 30 read with Schedule III, Part A, Para A, Clause 3',
            requirement: 'Event-based disclosure (Deemed Material)',
            text: 'Disclosure of New Rating(s) or Revision in Rating(s) assigned by a credit rating agency to any debt instrument, fixed deposit programme, or scheme/proposal involving fund mobilization (in India or abroad). Downward revision reasons must be intimated.',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_01',
            penalty: '',
            source: 'LODR.pdf, Master Circular - Very Imp_Reg 30_LODR_13July2023.pdf, Very Imp_Reg 30_LODR_13July2023.pdf'
          },
          {
            id: 3,
            typeOfEntity: 'Listed entity with listed specified securities',
            regulation: 'Regulation 46(2)(r)',
            requirement: 'Website disclosure',
            text: 'Disclose all credit ratings obtained by the entity for all its outstanding instruments on its functional website.',
            format: 'Disclosed on the entity website',
            validationCheck: 'announcement_date - website_date <= 24H',
            ruleId: 'CR_02',
            penalty: 'Regulation 46 - Non-compliance results in Advisory/warning letter per instance of non-compliance per item; or ₹ 10,000 per instance for every additional advisory/warning letter exceeding four in a financial year.',
            source: 'LODR.pdf, SEBI_Non-compliance with certain provisions of the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 and the Standard Operating Procedure for suspension and revocation of trading of specified securities.pdf'
          },
          {
            id: 4,
            typeOfEntity: 'Listed entity which has listed non-convertible securities',
            regulation: 'Regulation 55 (Chapter V)',
            requirement: 'Review requirement',
            text: 'Each rating obtained by the listed entity with respect to non-convertible securities shall be reviewed by a credit rating agency registered by the Board.',
            format: 'N/A',
            validationCheck: 'announcement_date present in last 12 months',
            ruleId: 'CR_03',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 5,
            typeOfEntity: 'Listed entity which has listed non-convertible securities',
            regulation: 'Regulation 56(1)(c)(i) (Chapter V)',
            requirement: 'Intimation to Debenture Trustees',
            text: 'The listed entity shall forward intimations regarding any revision in the rating to the debenture trustee.',
            format: 'N/A',
            validationCheck: '',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 6,
            typeOfEntity: 'Listed entity which has listed non-convertible securities',
            regulation: 'Regulation 62(1)(i) (Chapter V)',
            requirement: 'Website disclosure',
            text: 'Maintain a functional website containing all credit ratings obtained by the entity for all its listed non-convertible securities.',
            format: 'Disclosed on the entity website',
            validationCheck: 'announcement_date - website_date <= 24H',
            ruleId: 'CR_04',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 7,
            typeOfEntity: 'Special Purpose Distinct Entity (issuer of securitised debt instruments) and its Trustees',
            regulation: 'Regulation 84(1) (Chapter VIII)',
            requirement: 'Review requirement',
            text: 'Every rating obtained with respect to securitised debt instruments shall be periodically reviewed by a credit rating agency registered by the Board.',
            format: 'N/A',
            validationCheck: 'announcement_date present in last 12 months',
            ruleId: 'CR_05',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 8,
            typeOfEntity: 'Recognised Stock Exchange(s)',
            regulation: 'Regulation 84(2) (Chapter VIII)',
            requirement: 'Dissemination',
            text: 'Any revision in rating(s) shall be disseminated by the stock exchange(s).',
            format: 'Disclosure by stock exchanges',
            validationCheck: '',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 9,
            typeOfEntity: 'Special Purpose Distinct Entity (issuer of securitised debt instruments) and its Trustees/Servicer',
            regulation: 'Regulation 85(2) (Chapter VIII)',
            requirement: 'Information to Investors',
            text: 'Provide information regarding revision in rating as a result of credit rating done periodically in terms of regulation 84 to its investors.',
            format: 'Disclosure to investors in electronic form/fax if consented',
            validationCheck: '',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 10,
            typeOfEntity: 'Special Purpose Distinct Entity (issuer of securitised debt instruments) and its Trustees',
            regulation: 'Schedule III, Part D, Para A(7) (Chapter VIII)',
            requirement: 'Disclosure of material information',
            text: 'Disclosure of revision in rating as a result of credit rating done periodically.',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_06',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 11,
            typeOfEntity: 'Issuer of security receipts',
            regulation: 'Regulation 87C(2) (Chapter VIII A)',
            requirement: 'Compliance with RBI requirements / NAV Disclosure',
            text: 'Comply with extant RBI requirement of obtaining credit rating of security receipts and declaration of the net asset value thereafter.',
            format: 'In quarters where both external valuation and credit rating are required, issuer shall disclose lower of the two calculated Net Asset Value',
            validationCheck: '',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 12,
            typeOfEntity: 'Issuer of security receipts',
            regulation: 'Schedule III, Part E, A(5) (Chapter VIII A)',
            requirement: 'Disclosure of material event (without materiality test)',
            text: 'Disclosure of periodic rating obtained from credit rating agency or any revision in the rating or any expected revision in rating.',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_07',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 13,
            typeOfEntity: 'Issuer of security receipts',
            regulation: 'Schedule III, Part E, A(7) (Chapter VIII A)',
            requirement: 'Disclosure of material event (without materiality test)',
            text: 'Disclosure of any proposal to change or change of credit rating agency or Valuer.',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_08',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 14,
            typeOfEntity: 'Asset Management Company (Managing Mutual Fund Scheme)',
            regulation: 'Regulation 90(2)(b) (Chapter IX)',
            requirement: 'Intimation regarding rating',
            text: 'Intimate the recognised stock exchange(s) of the rating of the scheme whose units are listed and any changes in the rating thereof (wherever applicable).',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_09',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 15,
            typeOfEntity: 'Listed entity which has listed non-convertible securities',
            regulation: 'Schedule III, Part B, Para A(13) (Chapter V)',
            requirement: 'Disclosure of material information',
            text: 'Disclosure of any revision in the rating.',
            format: 'Disclosure to stock exchanges',
            validationCheck: 'announcement_date - rating_date <= 24H',
            ruleId: 'CR_10',
            penalty: '',
            source: 'LODR.pdf'
          },
          {
            id: 16,
            typeOfEntity: 'Listed entity with listed specified securities',
            regulation: 'Schedule V, Part C, Clause 9(q)',
            requirement: 'Annual Report Disclosure',
            text: 'Disclosure of list of all credit ratings obtained by the entity along with any revisions thereto during the relevant financial year, for all debt instruments, fixed deposit programmes, or schemes involving mobilization of funds (in India or abroad).',
            format: 'Disclosure in Annual report',
            validationCheck:
              'Is annual_report = yes\nWithin annual_report, is Corp_gov_rep = yes\nWithin Corp_gov_rep, is Credit_rating = Yes',
            ruleId: 'CR_11',
            penalty: 'Regulation 27(2) - Non submission of the Corporate governance compliance report within the period provided under this regulation: Rs 2000 per day',
            source: 'LODR.pdf'
          }
        ]
      },
      {
        id: 2,
        name: 'Material Events',
        description: 'Disclosure of material events and information',
        category: 'Disclosure',
        keywords: ['material events', 'material information', 'event disclosure']
      },
      {
        id: 3,
        name: 'Board Meetings',
        description: 'Regulations regarding board meeting procedures and disclosures',
        category: 'Corporate Governance',
        keywords: ['board meeting', 'meeting notice', 'agenda']
      },
      {
        id: 4,
        name: 'Related Party Transactions',
        description: 'Disclosure and approval requirements for related party transactions',
        category: 'Corporate Governance',
        keywords: ['related party', 'transaction', 'RPT']
      },
      {
        id: 5,
        name: 'Corporate Actions',
        description: 'Disclosure requirements for various corporate actions',
        category: 'Corporate Governance',
        keywords: ['corporate action', 'dividend', 'bonus']
      }
    ]
  },
  {
    id: 2,
    title: 'Johannesburg Stock Exchange (JSE) Listing Requirements',
    category: 'Listing Obligations',
    description: 'Listing Obligations and Disclosure Requirements for JSE listed entities',
    date: '2020-01-01',
    lastAmended: '2024-01-01',
    keywords: ['JSE', 'Johannesburg', 'South Africa', 'listing', 'disclosure', 'dividends'],
    events: [
      {
        id: 1,
        name: 'Dividends',
        description: 'Disclosure requirements for dividend announcements and distributions',
        category: 'Disclosure',
        keywords: ['dividend', 'distribution', 'payout', 'shareholder'],
        regulations: [],
        isStaticTable: true, // Flag to indicate this should show static table
        staticTableData: [
          { 'Rule_id': 'EC_200', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Source ISIN should exist' },
          { 'Rule_id': 'EC_201', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Source Instrument Alpha code should exist' },
          { 'Rule_id': 'EC_202', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Source Instrument Name should exist' },
          { 'Rule_id': 'EC_203', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Dividend Number should exist' },
          { 'Rule_id': 'EC_204', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Declaration date should exist' },
          { 'Rule_id': 'EC_205', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Last Trade date should exist' },
          { 'Rule_id': 'VC_200', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Last Trade date must be greater than declaration_date' },
          { 'Rule_id': 'EC_206', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Trading Ex_dividend date should exist' },
          { 'Rule_id': 'VC_201', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Trading Ex_dividend date must be greater than Last Trade date' },
          { 'Rule_id': 'EC_207', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Record date should exist' },
          { 'Rule_id': 'VC_202', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Record date must be greater Trading Ex_dividend date' },
          { 'Rule_id': 'EC_208', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Dividend Payment date should exist' },
          { 'Rule_id': 'VC_203', 'Rule': 'Date_check', 'Score': 1, 'Description': 'Dividend Payment date must be greater than Record date' },
          { 'Rule_id': 'EC_209', 'Rule': 'Net_rate_cents_per_share', 'Score': 1, 'Description': 'Net_rate_cents_per_share is Mandatory for Dividend announcement' },
          { 'Rule_id': 'EC_210', 'Rule': 'Gross_local_rate_cents_per_share', 'Score': 1, 'Description': 'Gross_local_rate_cents_per_share is Mandatory for Dividend announcement' },
          { 'Rule_id': 'EC_211', 'Rule': 'SA_Withholding_tax_amount_cents_per_share', 'Score': 1, 'Description': 'SA_Withholding_tax_amount_cents_per_share is Mandatory for Dividend announcement' },
          { 'Rule_id': 'EC_212', 'Rule': 'SA_Withholding_tax_percentage', 'Score': 1, 'Description': 'SA_Withholding_tax_percentage is Mandatory for Dividend announcement' },
          { 'Rule_id': 'EC_213', 'Rule': 'Source_of_funds_ISO_Country_code', 'Score': 1, 'Description': 'Source_of_funds_ISO_Country_code is Mandatory for Dividend announcement' },
          { 'Rule_id': 'VC_204', 'Rule': 'Net_rate_cents_per_share calculation', 'Score': 1, 'Description': 'Validation of  -> net_rate_cents_per_share = (gross_local_rate_cents_per_share - sa_withholding_tax_amount_cents_per_share)' },
          { 'Rule_id': 'VC_205', 'Rule': 'SA_Withholding_tax_amount_cents_per_share calculation', 'Score': 1, 'Description': 'Validation of -> sa_withholding_tax_amount_cents_per_share = (gross_local_rate_cents_per_share * sa_withholding_tax_percentage)' },
          { 'Rule_id': 'EC_214', 'Rule': 'Foreign_Currency_Check', 'Score': 'Optional', 'Description': 'Foreign currency must exist when Gross foreign rate is provided -> Exchange rate must exist when Foreign currency is provided, but if Gross foreign rate is not provided, dependent fields are not required.' },
          { 'Rule_id': 'EC_215', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Event Type should exist' },
          { 'Rule_id': 'EC_216', 'Rule': 'Existence check', 'Score': 'Optional', 'Description': 'Foreign tax percentage should exist' },
          { 'Rule_id': 'EC_217', 'Rule': 'Existence check', 'Score': 'Optional', 'Description': 'Foreign tax amount cps should exist' },
          { 'Rule_id': 'EC_218', 'Rule': 'Existence check', 'Score': 'Optional', 'Description': 'Foreign tax reclaim percentage should exist' },
          { 'Rule_id': 'EC_219', 'Rule': 'Existence check', 'Score': 1, 'Description': 'Dividend Type should exist' }
        ]
      }
    ]
  }
];

// Component to detect if text is truncated and show "Read more" only when needed
function TextCell({ text, regulation, requirement, onReadMore }) {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const textElement = textRef.current;
        
        // Store original inline style
        const originalStyle = textElement.style.cssText;
        
        // Temporarily remove max-height to measure full content height
        textElement.style.maxHeight = 'none';
        const fullHeight = textElement.scrollHeight;
        
        // Restore original style
        textElement.style.cssText = originalStyle;
        
        // Get visible height with max-height constraint applied
        const visibleHeight = textElement.clientHeight;
        
        // Check if text is actually truncated (with small tolerance for rounding)
        const isTextTruncated = fullHeight > visibleHeight + 2;
        setIsTruncated(isTextTruncated);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      checkTruncation();
      // Also check after a short delay to account for any layout changes
      setTimeout(checkTruncation, 100);
    });
    
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text]);

  if (!text) return <span>N/A</span>;

  return (
    <div ref={containerRef} className="exact-text-cell">
      <div ref={textRef} className="preview-text">
        {text}
      </div>
      {isTruncated && (
        <button
          type="button"
          className="read-more-link"
          onClick={(e) => {
            e.stopPropagation();
            onReadMore(`${regulation} — ${requirement}`, text);
          }}
        >
          Read more
        </button>
      )}
    </div>
  );
}

function MainContent({ onLogout }) {
  const navigate = useNavigate();
  const { regulationId, eventId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showDirectory, setShowDirectory] = useState(!!regulationId || searchParams.get('view') === 'directory');
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalText, setModalText] = useState('');
  const [fetchedRegulations, setFetchedRegulations] = useState([]);
  const [loadingRegulations, setLoadingRegulations] = useState(false);
  const [regulationsError, setRegulationsError] = useState(null);
  
  // Load regulation and event from URL params
  useEffect(() => {
    if (regulationId) {
      const regulation = regulationsData.find(r => r.id === parseInt(regulationId));
      if (regulation) {
        setSelectedRegulation(regulation);
        setShowDirectory(false);
        
        if (eventId) {
          const event = regulation.events?.find(e => e.id === parseInt(eventId));
          if (event) {
            setSelectedEvent(event);
          } else {
            setSelectedEvent(null);
          }
        } else {
          setSelectedEvent(null);
        }
      }
    } else {
      setSelectedRegulation(null);
      setSelectedEvent(null);
      setShowDirectory(searchParams.get('view') === 'directory');
    }
  }, [regulationId, eventId, searchParams]);

  // Fetch credit rating table data from API when Credit Ratings event is selected
  useEffect(() => {
    // Check if selected event is Credit Ratings (id = 1)
    if (selectedEvent && selectedEvent.id === 1 && selectedEvent.name === 'Credit Ratings') {
      setLoadingRegulations(true);
      setRegulationsError(null);
      
      apiService.getCreditRatingTable()
        .then(response => {
          if (response.results && Array.isArray(response.results)) {
            //console.log('API response:', response.results);
            // Map API response to frontend format
            const mappedRegulations = response.results.map((reg, index) => ({
              id: reg.id || index + 1,
              regulation: reg.regulation || 'N/A',
              typeOfEntity: reg.typeOfEntity || 'N/A',
              requirement: reg.requirement || 'N/A',
              text: reg.text || 'N/A',
              format: reg.format || 'N/A',
              validationCheck: reg.validationCheck || '',
              penalty: reg.penalty || '',
              source: reg.source || null,
              ruleId: reg.ruleId || null,
              severity: reg.severity || null,
              score: reg.score !== null && reg.score !== undefined ? reg.score : null,
            }));
            setFetchedRegulations(mappedRegulations);
          } else {
            setFetchedRegulations([]);
          }
          setLoadingRegulations(false);
        })
        .catch(error => {
          console.error('Failed to fetch credit rating table:', error);
          setRegulationsError(error.message || 'Failed to load regulations');
          setLoadingRegulations(false);
          // Fallback to hardcoded data on error
          setFetchedRegulations([]);
        });
    } else {
      // Clear fetched regulations when not on Credit Ratings event
      setFetchedRegulations([]);
      setRegulationsError(null);
    }
  }, [selectedEvent]);

  // Filter regulations and events based on search query
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    regulationsData.forEach(regulation => {
      // Check if regulation matches
      const matchesRegulation = 
        regulation.title.toLowerCase().includes(query) ||
        regulation.category.toLowerCase().includes(query) ||
        regulation.description.toLowerCase().includes(query) ||
        regulation.keywords.some(keyword => keyword.toLowerCase().includes(query));
      
      // Check if any event matches
      const matchingEvents = regulation.events && regulation.events.filter(event => 
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        (event.keywords && event.keywords.some(keyword => keyword.toLowerCase().includes(query)))
      );
      
      // Add regulation if it matches
      if (matchesRegulation) {
        results.push({ type: 'regulation', data: regulation });
      }
      
      // Add individual matching events
      if (matchingEvents && matchingEvents.length > 0) {
        matchingEvents.forEach(event => {
          results.push({ type: 'event', data: event, regulation });
        });
      }
    });
    
    return results;
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rkb?search=${encodeURIComponent(searchQuery)}&view=directory`);
      setShowDirectory(true);
      setSelectedRegulation(null);
    }
  };

  const handleOpenDirectory = () => {
    navigate('/rkb?view=directory');
    setShowDirectory(true);
    setSearchQuery('');
    setSelectedRegulation(null);
    setSelectedEvent(null);
  };

  const handleCloseDirectory = () => {
    navigate('/rkb');
    setShowDirectory(false);
    setSelectedRegulation(null);
    setSelectedEvent(null);
  };

  const handleRegulationClick = (regulation) => {
    navigate(`/regulation/${regulation.id}`);
    setSelectedRegulation(regulation);
    setShowDirectory(false);
    setSelectedEvent(null);
  };
  
  const handleEventClick = (regulation, event) => {
    navigate(`/regulation/${regulation.id}/event/${event.id}`);
    setSelectedRegulation(regulation);
    setSelectedEvent(event);
    setShowDirectory(false);
  };

  const handleUpload = (reg) => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        //console.log('Uploading file for regulation:', reg.requirement, file.name);
        // Add your upload logic here
        alert(`File "${file.name}" selected for upload for ${reg.requirement}`);
      }
    };
    input.click();
  };

  const handleGenerate = (reg) => {
    //console.log('Generating document for regulation:', reg.requirement);
    // Add your generate logic here
    alert(`Generating document for ${reg.requirement}`);
  };

  const openTextModal = (title, fullText) => {
    setModalTitle(title);
    setModalText(fullText);
    setIsModalOpen(true);
  };

  const closeTextModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalText('');
  };

  return (
    <div className="App">
      <div className="container">
          
          {!showDirectory && !selectedRegulation && (
            <div className="homepage-content">
              <form onSubmit={handleSearch} className="search-section">
                <div className="search-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search regulations by keyword, title, or category..."
                    className="search-input"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedEvent(null);
                      }}
                      className="clear-search-button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                  <button type="submit" className="search-button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    Search
                  </button>
                </div>
              </form>
              
              <div className="divider">
                <span>OR</span>
              </div>
              
              <button onClick={handleOpenDirectory} className="directory-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Browse All Regulations
              </button>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && filteredSearchResults.length > 0 && !showDirectory && (
            <div className="search-results">
              <h2 className="results-title">Search Results ({filteredSearchResults.length})</h2>
              <div className="results-grid">
                {filteredSearchResults.map((result, idx) => (
                  <div 
                    key={`${result.type}-${result.data.id}-${idx}`} 
                    className={result.type === 'event' ? 'event-card' : 'regulation-card'}
                    onClick={() => {
                      if (result.type === 'event') {
                        handleEventClick(result.regulation, result.data);
                      } else {
                        handleRegulationClick(result.data);
                      }
                    }}
                  >
                    <span className={result.type === 'event' ? 'event-category-badge' : 'category-badge'}>
                      {result.type === 'event' ? result.data.category : result.data.category}
                    </span>
                    <h3 className={result.type === 'event' ? 'event-name' : 'card-title'}>
                      {result.type === 'event' ? result.data.name : result.data.title}
                    </h3>
                    <p className={result.type === 'event' ? 'event-description' : 'card-description'}>
                      {result.type === 'event' ? result.data.description : result.data.description}
                    </p>
                    {result.type === 'event' && result.data.keywords && (
                      <div className="card-keywords">
                        {result.data.keywords.map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">{keyword}</span>
                        ))}
                      </div>
                    )}
                    {result.type === 'event' && result.data.regulations && (
                      <span className="event-view-details">Click to view details →</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && filteredSearchResults.length === 0 && !showDirectory && (
            <div className="no-results">
              <p>No regulations found matching "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className="clear-button">
                Clear Search
              </button>
            </div>
          )}

          {/* Directory View */}
          {showDirectory && (
            <div className="directory-view">
              <div className="directory-header">
                <h2 className="directory-title">All Regulations</h2>
                <button onClick={handleCloseDirectory} className="close-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Close
                </button>
              </div>
              <div className="directory-grid">
                {regulationsData.map(regulation => (
                  <div 
                    key={regulation.id} 
                    className="regulation-card"
                    onClick={() => handleRegulationClick(regulation)}
                  >
                    <span className="category-badge">{regulation.category}</span>
                    <h3 className="card-title">{regulation.title}</h3>
                    <p className="card-description">{regulation.description}</p>
                    <div className="card-footer">
                      <span className="card-date">{regulation.date}</span>
                      <span className="card-keywords">
                        {regulation.keywords.slice(0, 2).map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">{keyword}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulation Detail View */}
          {selectedRegulation && (
            <div className="detail-view">
              <button onClick={() => navigate('/rkb?view=directory')} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Directory
              </button>
              <div className="detail-content">
                <span className="detail-category">{selectedRegulation.category}</span>
                <h2 className="detail-title">{selectedRegulation.title}</h2>
                <span className="detail-date">Date: {selectedRegulation.date}</span>
                {selectedRegulation.lastAmended && (
                  <span className="detail-date">Last Amended: {selectedRegulation.lastAmended}</span>
                )}
                <p className="detail-description">{selectedRegulation.description}</p>
                
                {!selectedEvent && selectedRegulation.events && selectedRegulation.events.length > 0 && (
                  <div className="detail-events">
                    <h3>Events</h3>
                    <div className="events-grid">
                      {selectedRegulation.events.map((event) => (
                        <div 
                          key={event.id} 
                          className="event-card"
                          onClick={() => (event.regulations || event.isStaticTable) && handleEventClick(selectedRegulation, event)}
                          style={{ cursor: (event.regulations || event.isStaticTable) ? 'pointer' : 'default' }}
                        >
                          <span className="event-category-badge">{event.category}</span>
                          <h4 className="event-name">{event.name}</h4>
                          <p className="event-description">{event.description}</p>
                          {event.keywords && (
                            <div className="card-keywords">
                              {event.keywords.map((keyword, idx) => (
                                <span key={idx} className="keyword-tag">{keyword}</span>
                              ))}
                            </div>
                          )}
                          {(event.regulations || event.isStaticTable) && (
                            <span className="event-view-details">Click to view details →</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEvent && (selectedEvent.regulations || fetchedRegulations.length > 0 || selectedEvent.isStaticTable) && (
                  <div className="event-detail-view">
                    <button onClick={() => navigate(`/regulation/${selectedRegulation.id}`)} className="back-to-events-button">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                      Back to Events
                    </button>
                    <div className="event-detail-header">
                      <h3>{selectedEvent.name}</h3>
                      <p className="event-detail-subtitle">{selectedEvent.description}</p>
                    </div>
                    {loadingRegulations && (
                      <div className="loading-message" style={{ padding: '20px', textAlign: 'center' }}>
                        Loading regulations...
                      </div>
                    )}
                    {regulationsError && (
                      <div className="error-message" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                        Error: {regulationsError}
                      </div>
                    )}
                    {selectedEvent.isStaticTable && selectedEvent.staticTableData && selectedEvent.staticTableData.length > 0 ? (
                      <div className="regulations-table">
                        <table>
                          <thead>
                            <tr>
                              {Object.keys(selectedEvent.staticTableData[0]).map((key, idx) => (
                                <th key={idx}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEvent.staticTableData.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {Object.values(row).map((value, colIdx) => (
                                  <td key={colIdx}>{value || 'N/A'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="regulations-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Regulation / Clause</th>
                            <th>Type of entity</th>
                            <th>Requirement</th>
                            <th>Summary Regulatory Text</th>
                            <th>Format / Details</th>
                            <th>Validation Check</th>
                            <th>Penalty/Action</th>
                            <th>Score</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fetchedRegulations.length > 0 ? fetchedRegulations : selectedEvent.regulations || []).map((reg) => (
                            <tr key={reg.id}>
                              <td>{reg.regulation || 'N/A'}</td>
                              <td>{reg.typeOfEntity || 'N/A'}</td>
                              <td>{reg.requirement}</td>
                              <td>
                                <TextCell
                                  text={reg.text}
                                  regulation={reg.regulation}
                                  requirement={reg.requirement}
                                  onReadMore={openTextModal}
                                />
                              </td>
                              <td>{reg.format}</td>
                              <td className="validation-check-cell">
                                {reg.validationCheck ? (
                                  <div className="validation-check-content">
                                    {reg.severity && (
                                      <div className={`severity-indicator severity-${reg.severity.toLowerCase()}`}>
                                        <span className="severity-dot"></span>
                                        <span className="severity-text">{reg.severity}</span>
                                      </div>
                                    )}
                                    <ol className="validation-ol">
                                      {reg.validationCheck.split('\n').map((line, idx) => {
                                        const cleaned = line.replace(/^\s*\d+\.\s*/, '').trim();
                                        if (!cleaned) {
                                          return null;
                                        }
                                        return (
                                          <li key={idx} className="validation-line">
                                            {reg.ruleId && <span className="validation-rule-id">{reg.ruleId}</span>}
                                            <span className="validation-rule-text">{cleaned}</span>
                                          </li>
                                        );
                                      })}
                                    </ol>
                                  </div>
                                ) : (
                                  <span className="no-validation">N/A</span>
                                )}
                              </td>
                              <td className="penalty-cell">
                                {reg.penalty ? (
                                  <div className="penalty-content">{reg.penalty}</div>
                                ) : (
                                  <span className="no-penalty">N/A</span>
                                )}
                              </td>
                              <td className="score-cell">
                                {reg.score !== null && reg.score !== undefined ? (
                                  <span className="score-value">{reg.score}</span>
                                ) : (
                                  <span className="no-score">N/A</span>
                                )}
                              </td>
                              <td className="source-cell">
                                {reg.source ? (
                                  <a 
                                    href={reg.source.startsWith('http') ? reg.source : '#'} 
                                    target={reg.source.startsWith('http') ? '_blank' : undefined}
                                    rel={reg.source.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    className="source-link"
                                    onClick={!reg.source.startsWith('http') ? (e) => { e.preventDefault(); } : undefined}
                                    title={reg.source}
                                  >
                                    View Source
                                  </a>
                                ) : (
                                  <span className="source-text">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                    {isModalOpen && (
                      <div className="modal-overlay" onClick={closeTextModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                          <div className="modal-header">
                            <h4 className="modal-title">{modalTitle}</h4>
                            <button className="modal-close" onClick={closeTextModal} aria-label="Close">×</button>
                          </div>
                          <div className="modal-body">
                            <p>{modalText}</p>
                          </div>
                          <div className="modal-footer">
                            <button className="modal-close-button" onClick={closeTextModal}>Close</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!selectedEvent && (
                  <div className="detail-keywords">
                    <h3>Keywords:</h3>
                    <div className="keywords-container">
                      {selectedRegulation.keywords.map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user has a valid token
    const token = apiService.getToken();
    const user = localStorage.getItem('user');
    return !!(token && user);
  });
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    // Set up activity listeners for inactivity timeout
    if (isAuthenticated) {
      apiService.setupActivityListeners();
      
      // Set up token refresh interval (every 10 minutes)
      const refreshInterval = setInterval(async () => {
        try {
          await apiService.refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          handleLogout();
        }
      }, 10 * 60 * 1000); // 10 minutes

      return () => {
        clearInterval(refreshInterval);
        if (apiService.inactivityTimer) {
          clearTimeout(apiService.inactivityTimer);
        }
      };
    }
  }, [isAuthenticated]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <DisclosuresProvider>
      <AgentProvider>
      <Router>
        <Routes>
        <Route 
          path="/" 
          element={<Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/login" 
          element={<Login onLogin={handleLogin} />} 
        />
        <Route
          path="/choose-agent"
          element={
            isAuthenticated ? (
              <AgentPicker />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Dashboard />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/upload" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <UploadDisclosure />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/validation" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <ValidationHistory />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route
          path="/validation/:disclosureId"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <DisclosureDetailsPage />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/rkb/*" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <MainContent onLogout={handleLogout} />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/feedback" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Feedback />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route
          path="/regulator/live-feed"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <RegulatorLiveFeed />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/regulator/review"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <RegulatorReview />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/regulator/entity-master"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <EntityMaster />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/regulation/:regulationId" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <MainContent onLogout={handleLogout} />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/regulation/:regulationId/event/:eventId" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <MainContent onLogout={handleLogout} />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Profile user={user} />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/analyzer/home"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AnalyzerDashboard />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/analyzer/insight"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <InsightAgent />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/analyzer/history"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AnalysisHistory />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/analyzer/knowledge"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AnalyzerKnowledgeCenter />
              </Layout>
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        </Routes>
      </Router>
      </AgentProvider>
    </DisclosuresProvider>
  );
}

export default App;
