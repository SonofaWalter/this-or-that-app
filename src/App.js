import React, { useState, useEffect, useCallback } from 'react';

// Main App component
const App = () => {
  // State to hold the currently selected category
  const [selectedCategory, setSelectedCategory] = useState('Everyday Life');
  // State for the first displayed option
  const [optionA, setOptionA] = useState('');
  // State for the second displayed option
  const [optionB, setOptionB] = useState('');
  // State to indicate if options are currently being generated (for loading indicator)
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState('');

  // History state: an array to store previously generated questions
  // Each item will be an object like { category: string, optionA: string, optionB: string }
  // History is still maintained internally for potential future features or debugging,
  // but the "Previous Question" button is removed from the UI.
  const [history, setHistory] = useState([]);
  // Index to keep track of the current position in the history array
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 means no question loaded yet

  // Define the categories for the "This or That" game
  const categories = [
    "Everyday Life",
    "Superpowers",
    "Travel & Adventure",
    "Food & Drink",
    "Past or Future",
    "Silly Scenarios",
    "Animals",
    "Personal Quirks",
    "Relationships"
  ];

  /**
   * Fetches two "This or That" options from the Gemini API based on the given category.
   * This function is responsible only for the API call and returning the raw options.
   * @param {string} category - The category to generate options for.
   * @returns {Promise<string[]>} - A promise that resolves to an array of two strings [option1, option2].
   */
  const fetchOptionsFromAI = useCallback(async (category) => {
    setError(''); // Clear any previous errors
    try {
      // In the Canvas environment, process.env is not defined.
      // The Canvas runtime automatically provides the API key in the fetch call if 'apiKey' is an empty string.
      // For Netlify deployment, remember to change this back to process.env.REACT_APP_GEMINI_API_KEY.
      const apiKey = ""; 

      // Construct the prompt for the AI model
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

      // Chat history for the API request
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      // Payload for the Gemini API request
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json", // Request JSON output
          responseSchema: {
            type: "ARRAY", // Expect an array
            items: {
              type: "STRING" // Each item in the array should be a string
            },
            minItems: 2, // Ensure at least two items
            maxItems: 2 // Ensure exactly two items
          },
          temperature: 1.0, // MAX temperature for highest randomness and creativity
          // topP: 0.95, // Can also experiment with topP for diversity
        }
      };
      // --- END ENHANCED PROMPT AND GENERATION CONFIG ---

      // API URL for Gemini 2.0 Flash
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Make the fetch call to the Gemini API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Check if the response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
      }

      // Parse the JSON response
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

  /**
   * Generates new options, adds them to history, and updates the display.
   * This is called when the "Next Question" button is clicked or a new category is selected.
   */
  const handleGenerateNew = useCallback(async (initialLoad = false) => {
    setIsLoading(true); // Set loading state to true
    const newOptions = await fetchOptionsFromAI(selectedCategory);
    const [newOptionA, newOptionB] = newOptions;

    // Only add to history if options were successfully generated and it's not an initial empty state
    if (newOptionA || newOptionB) { // Check if at least one option has content
        const newHistoryItem = {
          category: selectedCategory,
          optionA: newOptionA,
          optionB: newOptionB
        };

        setHistory((prevHistory) => {
          // If we are not at the end of the history, truncate the "future" history
          const updatedHistory = initialLoad ? [] : prevHistory.slice(0, historyIndex + 1);
          return [...updatedHistory, newHistoryItem];
        });

        // Update history index to point to the newly added item
        setHistoryIndex((prevIndex) => initialLoad ? 0 : prevIndex + 1);
    } else {
        // If options failed to generate, clear them from display
        setOptionA('');
        setOptionB('');
    }

    // Set the displayed options
    setOptionA(newOptionA);
    setOptionB(newOptionB);
    setIsLoading(false); // Reset loading state
  }, [selectedCategory, fetchOptionsFromAI, historyIndex]); // Dependencies for useCallback

  // handlePrevious function is removed as the button is removed.
  // The history state management remains, but is not exposed via a UI button.

  // Effect to handle initial load and category changes
  useEffect(() => {
    const currentQuestion = history[historyIndex];
    if (!currentQuestion || currentQuestion.category !== selectedCategory) {
        handleGenerateNew(historyIndex === -1); // Pass true for initial load
    }
  }, [selectedCategory, handleGenerateNew, history, historyIndex]); // Dependencies for useEffect

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex flex-col items-center justify-center p-4 font-sans text-white">
      {/* App Title */}
      <h1 className="text-5xl font-extrabold mb-8 drop-shadow-lg text-center">This or That?</h1>

      {/* Category Selection */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-8 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Choose a Category:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-5 py-3 rounded-xl text-lg font-medium transition-all duration-300 ease-in-out
                ${selectedCategory === category
                  ? 'bg-emerald-800 text-white shadow-lg scale-105 transform' // Darker emerald for selected
                  : 'bg-green-700 hover:bg-green-600 text-white hover:scale-105 transform shadow-md'}
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-500
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Options Display Area */}
      <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 shadow-2xl w-full max-w-4xl flex flex-col items-center justify-center min-h-[250px]">
        {isLoading ? (
          <div className="flex flex-col items-center">
            {/* Simple spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-300"></div> {/* Green spinner */}
            <p className="mt-4 text-xl">Generating options...</p>
          </div>
        ) : error ? (
          <p className="text-red-300 text-center text-xl">{error}</p>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center w-full">
            {/* Option A */}
            <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-xl flex-1 m-2 w-full md:w-auto min-h-[120px] flex items-center justify-center text-center text-2xl font-semibold mb-4 md:mb-0 transform hover:scale-105 transition-transform duration-300">
              {optionA || "Select a category and click 'Next Question'!"}
            </div>

            <p className="text-white text-3xl font-bold mx-4 hidden md:block">OR</p>
            <p className="text-white text-3xl font-bold my-4 md:hidden">OR</p>

            {/* Option B */}
            <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-xl flex-1 m-2 w-full md:w-auto min-h-[120px] flex items-center justify-center text-center text-2xl font-semibold transform hover:scale-105 transition-transform duration-300">
              {optionB || "Your options will appear here."}
            </div>
          </div>
        )}
      </div>

      {/* Navigation and Generate Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full max-w-4xl">
        {/* Previous Question button removed as requested */}
        {/* <button
          onClick={handlePrevious}
          disabled={isLoading || historyIndex <= 0}
          className={`
            px-6 py-3 rounded-full text-xl font-bold shadow-lg transition-all duration-300 ease-in-out
            bg-green-500 hover:bg-green-600 text-white
            ${isLoading || historyIndex <= 0 ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transform'}
            focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-emerald-700
          `}
        >
          Previous Question
        </button> */}

        <button
          onClick={handleGenerateNew}
          disabled={isLoading} // Disable button while loading
          className={`
            px-8 py-4 rounded-full text-2xl font-bold shadow-2xl transition-all duration-300 ease-in-out
            bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto
            ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transform'}
            focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-emerald-700
          `}
        >
          {isLoading ? 'Generating...' : 'Next Question'}
        </button>
      </div>

      {/* Footer / Credits */}
      <p className="text-sm text-white/70 mt-10">
        Powered by Google's Gemini API
      </p>
    </div>
  );
};

export default App;
