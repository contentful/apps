// Import all test documents
import Doc1 from './Doc_1_Basic_Structure_Test.json';
import Doc2 from './Doc_2_Rich_Text_Formatting_Test.json';
import Doc3 from './Doc_3_Nested_Structures_And_References_Test.json';
import Doc4 from './Doc_4_Media_Embeds_Test.json';
import Doc5 from './Doc_5_Bulk_Entry_Stress_Test.json';
import Doc6 from './Doc_6_Multilingual_Test.json';
import Doc7 from './Doc_7_Edge_Cases_Test.json';
import Doc8 from './Doc_8_DXP_benefits - Sample.json';

// Optional import: Doc9 may not exist in all environments (e.g., S3 hosted app)
const doc9Modules = (import.meta as any).glob('./Doc_9_Customer_Example_Doc.json', { eager: true });
const Doc9 = doc9Modules?.['./Doc_9_Customer_Example_Doc.json']?.default || null;

// Export test documents array
export const TEST_DOCUMENTS = [
  { id: 'doc1', title: 'Doc 1: Basic Structure Test', data: Doc1 },
  { id: 'doc2', title: 'Doc 2: Rich Text Formatting Test', data: Doc2 },
  { id: 'doc3', title: 'Doc 3: Nested Structures And References Test', data: Doc3 },
  { id: 'doc4', title: 'Doc 4: Media Embeds Test', data: Doc4 },
  { id: 'doc5', title: 'Doc 5: Bulk Entry Stress Test', data: Doc5 },
  { id: 'doc6', title: 'Doc 6: Multilingual Test', data: Doc6 },
  { id: 'doc7', title: 'Doc 7: Edge Cases Test', data: Doc7 },
  { id: 'doc8', title: 'Doc 8: DXP Benefits Sample', data: Doc8 },
  { id: 'doc9', title: 'Doc 9: Customer Example Doc', data: Doc9 },
];
