import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  const { picks } = await request.json();

  const filledPicks = Object.entries(picks)
    .filter(([_, champ]) => champ !== "")
    .map(([role, champ]) => `${role}: ${champ}`)
    .join(", ");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a League of Legends expert assistant for a tool called Synergy.GG.
        
A player's team currently has these champions picked: ${filledPicks}

Based on this team composition, recommend exactly 3 champions the player could pick to best synergize with the team. 

For each recommendation provide:
1. Champion name
2. Recommended role
3. A 1-2 sentence explanation of why they synergize well

Format your response as JSON like this:
{
  "recommendations": [
    {
      "champion": "Champion Name",
      "role": "Role",
      "reason": "Explanation here"
    }
  ]
}

Return only the JSON, no other text.`
      }
    ]
  });

  const text = message.content[0].text.replace(/```json\n?|\n?```/g, "").trim();
const response = JSON.parse(text);
  return Response.json(response);
}