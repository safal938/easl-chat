#!/usr/bin/env node

/**
 * Test script to verify Board App integration
 * 
 * Usage:
 *   node scripts/test-board-integration.js
 * 
 * This script tests:
 * 1. Sending a complete response to the Board App API
 * 2. Retrieving conversation history
 */

const BOARD_API_URL = process.env.BOARD_API_URL || 'http://localhost:3001';

// Test data
const testQuery = "What are the recommended treatments for hepatocellular carcinoma?";
const testResponse = `## Medical Reasoning

The patient presents with hepatocellular carcinoma (HCC). Based on the clinical guidelines and patient assessment, we need to consider:

1. **Tumor Stage**: Evaluate using BCLC staging system
2. **Liver Function**: Assess Child-Pugh score
3. **Performance Status**: ECOG performance status
4. **Comorbidities**: Evaluate cardiovascular and renal function

## Answer

{
  "short_answer": "Treatment options for HCC depend on tumor stage, liver function, and patient performance status. Options include surgical resection, liver transplantation, ablation therapies, TACE, and systemic therapy.",
  "detailed_answer": "For early-stage HCC (BCLC 0-A), curative treatments include surgical resection, liver transplantation, or ablation (RFA/MWA). For intermediate-stage (BCLC B), trans-arterial chemoembolization (TACE) is recommended. Advanced-stage (BCLC C) patients may benefit from systemic therapy with sorafenib or lenvatinib. Treatment selection should be individualized based on tumor characteristics, liver function, and patient factors.",
  "guideline_reference": [
    {
      "Source": "EASL Clinical Practice Guidelines: Management of hepatocellular carcinoma",
      "Link": "https://easl.eu/guidelines",
      "Supporting_Snippet": "The BCLC staging system is recommended for treatment allocation in HCC patients."
    }
  ]
}

## Local Guideline Analysis

The clinical reasoning provided focuses on the evidence-based approach to HCC management. The local institutional guideline (ICLO) emphasizes:

* **Comprehensive Staging**: Integration of BCLC staging with comorbidity assessment
* **Multidisciplinary Approach**: MDT discussion for all new HCC diagnoses
* **Treatment Hierarchy**: Prioritization based on oncologic efficacy and patient safety
* **Liver Transplantation Criteria**: Specific prerequisites and contraindications
* **Post-Treatment Surveillance**: Structured follow-up protocol

The reasoning aligns well with institutional protocols, particularly in emphasizing individualized treatment selection and multidisciplinary decision-making.`;

const testMetadata = {
  chatId: "test-chat-123",
  messageId: "test-msg-456",
  expertName: "Hepatocellular Carcinoma Expert",
  source: "test-script",
  hasReasoning: true,
  hasSafetyAnalysis: false,
  hasLocalGuidelineAnalysis: true,
  timestamp: new Date().toISOString(),
  guidelineAnalysis: {
    expertName: "Hepatocellular_Carcinoma",
    modelVersion: "gemini-2.5-flash",
    modelDescription: "Local guideline comparison analysis",
    timestamp: new Date().toISOString(),
  },
};

async function testSendResponse() {
  console.log('🧪 Testing Board App Integration\n');
  console.log('📍 Board API URL:', BOARD_API_URL);
  console.log('');

  try {
    console.log('1️⃣ Sending complete response to Board App...');
    
    const response = await fetch(`${BOARD_API_URL}/api/easl-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'complete',
        query: testQuery,
        response: testResponse,
        metadata: testMetadata,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Response sent successfully!');
      console.log('   Conversation ID:', result.conversationId);
      console.log('   Total Conversations:', result.totalConversations);
      console.log('');
      return result.conversationId;
    } else {
      const error = await response.json();
      console.error('❌ Failed to send response:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error sending response:', error.message);
    console.log('');
    console.log('💡 Make sure the Board App is running on', BOARD_API_URL);
    return null;
  }
}

async function testGetHistory() {
  try {
    console.log('2️⃣ Retrieving conversation history...');
    
    const response = await fetch(`${BOARD_API_URL}/api/easl-history?limit=5`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ History retrieved successfully!');
      console.log('   Total Conversations:', result.totalConversations);
      console.log('   Retrieved:', result.conversations.length, 'conversations');
      console.log('');
      
      if (result.conversations.length > 0) {
        console.log('📋 Most Recent Conversation:');
        const latest = result.conversations[0];
        console.log('   ID:', latest.id);
        console.log('   Query:', latest.query.substring(0, 80) + '...');
        console.log('   Response Length:', latest.response.length, 'characters');
        console.log('   Timestamp:', latest.timestamp);
        console.log('');
      }
      
      return result;
    } else {
      const error = await response.json();
      console.error('❌ Failed to get history:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting history:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EASL Board App Integration Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Test 1: Send response
  const conversationId = await testSendResponse();

  if (!conversationId) {
    console.log('⚠️  Skipping history test due to send failure');
    console.log('');
    process.exit(1);
  }

  // Small delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Get history
  await testGetHistory();

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ All tests completed!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check the Board App UI to verify the response is stored');
  console.log('2. Test with a real query in the EASL chat app');
  console.log('3. Monitor console logs for successful API calls');
  console.log('');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
