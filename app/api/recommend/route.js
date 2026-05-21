import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  const { picks, enemies, myRole } = await request.json();

  const filledPicks = Object.entries(picks)
    .filter(([_, champ]) => champ !== "")
    .map(([role, champ]) => `${role}: ${champ}`)
    .join(", ");

  const enemyPicks = Object.entries(enemies)
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

The player is filling the ${myRole} role.
Ally team picks: ${filledPicks || "None yet"}
${enemyPicks ? `Enemy team picks: ${enemyPicks}` : "No enemy picks provided."}

Recommend exactly 3 champions for the ${myRole} role that synergize with the ally team and counter the enemy team.

For each recommendation provide:
1. Champion name
2. Role (should be ${myRole})
3. A 1-2 sentence explanation covering synergy and counter aspects

Format your response as JSON like this:
{
  "recommendations": [
    {
      "champion": "Champion Name",
      "role": "${myRole}",
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