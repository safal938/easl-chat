
export interface DrugSafetyButtonProps {
    userMessage: string;
    aiResponse: string;
    className?: string;
    messageId?: string;
    chatId?: string | null;
    userId?: string;
  }
  
  export interface DrugSafetyModalProps {
    isOpen: boolean;
    onClose: () => void;
    safetyData: SafetyAnalysis | null;
    error: string | null;
    isLoading: boolean;
    progress: number;
    stageIndex: number;
    stageProgress: number;
    isStalled: boolean;
  }
  
  export interface ExtractedDrug {
    drug_name: string;
    type: string;
    context: string;
  }
  
  export interface AdverseEventsData {
    drug_name: string;
    extraction_date: string;
    total_cases: number;
    total_cases_in_database: number;
    total_reactions: number;
    frequency_analysis: {
      top_reactions: Record<string, number>;
      total_unique_reactions: number;
      total_reaction_reports: number;
    };
    severity_analysis: {
      serious_cases: number;
      death_cases: number;
      hospitalization_cases: number;
      life_threatening_cases: number;
      disability_cases: number;
      seriousness_rate_percent: number;
    };
    demographic_analysis: {
      age_group_distribution: Record<string, number>;
      sex_distribution: Record<string, number>;
      top_countries: Record<string, number>;
      cases_with_age_data: number;
      cases_with_sex_data: number;
    };
    message?: string;
  }
  
  export interface LabelingData {
    drug_name: string;
    extraction_date: string;
    labeling_available: boolean;
    indications_and_usage: string;
    warnings: string;
    dosage_and_administration: string;
    contraindications: string;
    adverse_reactions: string;
    drug_interactions: string;
    pediatric_use: string;
    geriatric_use: string;
    pregnancy: string;
    message?: string;
  }
  
  export interface DrugAnalysis {
    drug_name: string;
    is_primary: boolean;
    drug_type?: string;
    context?: string;
    safety_data: {
      analysis_info: {
        drug_analyzed: string;
        analysis_date: string;
        analysis_type: string;
      };
      adverse_events_data?: AdverseEventsData;
      labeling_data?: LabelingData;
      summary: {
        total_adverse_event_cases: number;
        labeling_available: boolean;
        data_sources: string[];
      };
    };
  }
  
  export interface DrugInteraction {
    analysis_info: {
      drug_x: string;
      drug_y: string;
      analysis_date: string;
      analysis_type: string;
      version: string;
    };
    drug_identifiers: {
      drug_x: {
        input_name: string;
        rxcui: string | null;
        found: boolean;
        suggestions: string[];
      };
      drug_y: {
        input_name: string;
        rxcui: string | null;
        found: boolean;
        suggestions: string[];
      };
    };
    drug_properties: {
      drug_x: any;
      drug_y: any;
    };
    interaction_analysis: {
      drug_1: string;
      drug_2: string;
      interaction_found: boolean;
      severity: string;
      description: string;
      mechanism: string;
      clinical_management: string;
    };
    summary: {
      both_drugs_found: boolean;
      interaction_severity: string;
      has_known_interaction: boolean;
      requires_monitoring: boolean;
    };
    drug_pair?: string[];
    description?: string;
  }
  
  export interface SafetyAnalysis {
    success: boolean;
    session_id: string;
    analysis_timestamp: string;
    extraction_result: {
      drugs_found: boolean;
      extracted_drugs: ExtractedDrug[];
      total_drugs: number;
      message: string;
    };
    safety_analysis?: {
      total_drugs_analyzed: number;
      analyze_primary_only: boolean;
      drug_analyses: DrugAnalysis[];
    };
    drug_interaction_analysis?: {
      analysis_info: {
        total_drugs: number;
        drug_list: string[];
        total_pairs_analyzed: number;
        analysis_date: string;
        analysis_type: string;
        status: string;
      };
      drug_interactions: DrugInteraction[];
      summary: {
        total_pairs_analyzed: number;
        high_risk_interactions: number;
        moderate_risk_interactions: number;
        unknown_interactions: number;
        safe_combinations: number;
        highest_risk_level: string;
        requires_clinical_review: boolean;
      };
      clinical_alerts?: {
        high_risk_pairs: string[][];
        moderate_risk_pairs: string[][];
      };
    };
    general_safety: string;
    toxicity_analysis: string;
    adverse_events_interpretation: string;
    drug_interaction_analysis_interpretation: string;
    clinical_recommendation: string;
    message: string;
    error: string | null;
  }