import { Grievance } from "../types";
import { API_URL } from "./apiClient";

export const GeminiService = {
  /**
   * Generates a polite, official response based on the grievance context.
   * NOTE: This should be moved to a Supabase Edge Function for production.
   */
  async draftResponse(grievance: Grievance): Promise<string> {
    console.warn("Recommendation: Move AI drafting to an Edge Function.");
    return "Drafting response logic has been disabled in the frontend for security.";
  },

  /**
   * Analyzes an image to auto-detect the grievance category and write a description.
   * NOTE: Highly recommended to move this to an Edge Function to protect API keys.
   */
  async analyzeImageEvidence(base64Image: string): Promise<{ category: string, description: string }> {
    console.warn("Recommendation: Move Image Analysis to an Edge Function.");
    return { category: "Other", description: "Image analysis is disabled in the frontend." };
  },

  /**
   * Triggers the backend API for strategic analysis.
   */
  async analyzeGrievance(grievance: Grievance) {
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ record: grievance }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Backend API Error:", error);
      return null;
    }
  },

  /**
   * Predicts the category based on description.
   */
  async predictCategory(description: string): Promise<string> {
    console.warn("Recommendation: Move Category Prediction to an Edge Function.");
    return "Other";
  }
};