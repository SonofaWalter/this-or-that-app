import React, { useState, useEffect, useCallback } from 'react';

// Main App component
const App = () => {
  // ... (rest of your state declarations) ...

  /**
   * Fetches two "This or That" options from the Gemini API based on the given category.
   * This function is responsible only for the API call and returning the raw options.
   * @param {string} category - The category to generate options for.
   * @returns {Promise<string[]>} - A promise that resolves to an array of two strings [option1, option2].
   */
  const fetchOptionsFromAI = useCallback(async (category) => {
    setError('');
    try {
      // TEMPORARY: LOGGING API KEY FOR DIAGNOSIS IN NETLIFY BUILD LOGS
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
      console.log('--- Netlify Build Log Check: API Key Value ---', apiKey); // This line is new
      // --- END TEMPORARY LOGGING ---

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please set REACT_APP_GEMINI_API_KEY in Netlify environment variables.");
      }

      // ... (rest of your prompt and payload definition) ...

      const prompt = `Generate two distinct, highly creative, engaging, and **completely unique** "This or That" options for the category "${category}".
      **Crucially, ensure that the two options use different primary keywords and concepts to avoid any repetition or similarity in wording, even if subtle.**
      The options should be short phrases and present a clear dilemma.
      
      Example for "Food & Drink":
      - "Eat only bland food for life"
      - "Eat only extremely spicy food for life"
      
      Example for "Superpowers":
      - "Ability to fly anywhere instantly"
      - "Ability to control minds but only while sleeping"

      Provide the response in a JSON array format with two strings, like:
      ["Option 1 Text", "Option 2 Text"]`;

      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "STRING"
            },
            minItems: 2,
            maxItems: 2
          },
          temperature: 1.0,
        }
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const options = JSON.parse(jsonString);

        if (Array.isArray(options) && options.length === 2 &&
            typeof options[0] === 'string' && typeof options[1] === 'string') {
          return options;
        } else {
          throw new Error('AI response format was unexpected. Expected an array of two strings.');
        }
      } else {
        throw new Error('Failed to generate options from AI. Response was empty or malformed.');
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      setError(`Failed to fetch options: ${err.message}. Please check your network or API key configuration.`);
      return ['', ''];
    }
  }, []);

  // ... (rest of your App component) ...
};

export default App;
