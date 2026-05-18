const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

exports.generateProofOfEffort = async (fileDescription) => {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze the following file description and provide a "Proof of Effort" report for a client. 
          Respond ONLY with a JSON object containing:
          - originalityScore (0-100)
          - effortLevel (Low, Medium, or High)
          - summary (max 2 sentences)
          
          Description: ${fileDescription}`
        }
      ],
    });

    const content = response.content[0].text;
    // Sanitize response: remove markdown code blocks if present
    const jsonStr = content.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Claude API Error:', err.message);
    return {
      originalityScore: 0,
      effortLevel: 'Unknown',
      summary: 'Effort report could not be generated.'
    };
  }
};
