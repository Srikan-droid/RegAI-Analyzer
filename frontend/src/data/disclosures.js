export const initialDisclosures = [
  {
    id: 1,
    announcementTitle: 'Credit Rating Disclosure - Q3 FY2024',
    dateOfEvent: '2024-01-15',
    uploadedDate: '2024-01-15',
    regulations: ['Reg 30', 'Reg 46'],
    complianceScore: 85,
    complianceStatus: 'Compliant',
    fileStatus: 'Completed',
    fileName: 'credit_rating_q3_2024.pdf',
  },
  {
    id: 2,
    announcementTitle: 'Board Meeting Outcome - Annual Results',
    dateOfEvent: '2024-01-12',
    uploadedDate: '2024-01-12',
    regulations: ['Reg 46', 'Reg 55'],
    complianceScore: 35,
    complianceStatus: 'Non-Compliant',
    fileStatus: 'Completed',
    fileName: 'board_meeting_annual.pdf',
  },
  {
    id: 3,
    announcementTitle: 'Material Event - Change in Key Management',
    dateOfEvent: '2024-01-10',
    uploadedDate: '2024-01-10',
    regulations: ['Reg 33'],
    complianceScore: null,
    complianceStatus: 'Pending Review',
    fileStatus: 'Processing',
    fileName: 'material_event_management.docx',
  },
  {
    id: 4,
    announcementTitle: 'Related Party Transaction Disclosure',
    dateOfEvent: '2024-01-08',
    uploadedDate: '2024-01-08',
    regulations: ['Reg 45', 'Reg 55'],
    complianceScore: null,
    complianceStatus: 'Pending Review',
    fileStatus: 'Pending',
    fileName: 'related_party_transaction.docx',
  },
  {
    id: 5,
    announcementTitle: 'Annual Corporate Governance Report',
    dateOfEvent: '2023-12-31',
    uploadedDate: '2024-01-05',
    regulations: ['Reg 27'],
    complianceScore: 92,
    complianceStatus: 'Compliant',
    fileStatus: 'Completed',
    fileName: 'corporate_governance_report.pdf',
  },
  {
    id: 6,
    announcementTitle: 'Press Release - Acquisition Announcement',
    dateOfEvent: '2023-12-20',
    uploadedDate: '2024-01-02',
    regulations: ['Reg 30'],
    complianceScore: null,
    complianceStatus: 'Compliant',
    fileStatus: 'Error',
    fileName: 'acquisition_press_release.pdf',
  },
  {
    id: 7,
    announcementTitle: 'Investor Presentation Update',
    dateOfEvent: '2023-12-15',
    uploadedDate: '2023-12-28',
    regulations: ['Reg 30', 'Reg 46'],
    complianceScore: null,
    complianceStatus: 'Pending Review',
    fileStatus: 'Cancelled',
    fileName: 'investor_presentation_update.pdf',
  },
];

export const REGULATION_OPTIONS = [
  'Reg 23',
  'Reg 27',
  'Reg 30',
  'Reg 33',
  'Reg 34',
  'Reg 45',
  'Reg 46',
  'Reg 52',
  'Reg 55',
];

export const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  
  // Handle both date strings (YYYY-MM-DD) and datetime strings (YYYY-MM-DDTHH:mm:ss...)
  let dateStr = isoDate;
  if (isoDate.includes('T')) {
    // Extract date part from datetime string
    dateStr = isoDate.split('T')[0];
  }
  
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return isoDate; // Return original if parsing fails
  
  return `${day}/${month}/${year}`;
};

// Format datetime to human-readable format (e.g., "04/12/2025, 10:30 AM")
export const formatDisplayDateTime = (isoDateTime) => {
  if (!isoDateTime) return '';
  
  try {
    const date = new Date(isoDateTime);
    if (isNaN(date.getTime())) return isoDateTime; // Invalid date
    
    // Format date part
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time part
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${day}/${month}/${year}, ${displayHours}:${minutes} ${ampm}`;
  } catch (error) {
    return isoDateTime; // Return original if formatting fails
  }
};

