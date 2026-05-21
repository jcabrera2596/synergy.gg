import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "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",
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

Provide:
1. A comp analysis of the ally team with scores from 1-5 for: engage, damage, peel, scaling, crowdControl
2. A one sentence win condition for the ally team
3. Exactly 3 champion recommendations for the ${myRole} role that synergize with allies and counter enemies

Format your response as JSON exactly like this:
{
  "analysis": {
    "engage": 3,
    "damage": 4,
    "peel": 2,
    "scaling": 3,
    "crowdControl": 4,
    "winCondition": "One sentence describing how this team wins"
  },
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