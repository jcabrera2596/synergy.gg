"use client";
import { useState } from "react";

const CHAMPIONS = [
  "Aatrox","Ahri","Akali","Akshan","Alistar","Amumu","Anivia","Annie","Aphelios",
  "Ashe","Aurelion Sol","Azir","Bard","Blitzcrank","Brand","Braum","Caitlyn",
  "Camille","Cassiopeia","Cho'Gath","Corki","Darius","Diana","Dr. Mundo","Draven",
  "Ekko","Elise","Evelynn","Ezreal","Fiddlesticks","Fiora","Fizz","Galio",
  "Gangplank","Garen","Gnar","Gragas","Graves","Gwen","Hecarim","Heimerdinger",
  "Irelia","Ivern","Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx","Kai'Sa",
  "Kalista","Karma","Karthus","Kassadin","Katarina","Kayle","Kayn","Kennen",
  "Kha'Zix","Kindred","Kled","Kog'Maw","LeBlanc","Lee Sin","Leona","Lillia",
  "Lissandra","Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","Master Yi",
  "Miss Fortune","Mordekaiser","Morgana","Nami","Nasus","Nautilus","Neeko",
  "Nidalee","Nocturne","Nunu","Olaf","Orianna","Ornn","Pantheon","Poppy",
  "Pyke","Qiyana","Quinn","Rakan","Rammus","Rek'Sai","Rell","Renata Glasc",
  "Renekton","Rengar","Riven","Rumble","Ryze","Samira","Sejuani","Senna",
  "Seraphine","Sett","Shaco","Shen","Shyvana","Singed","Sion","Sivir","Skarner",
  "Sona","Soraka","Swain","Sylas","Syndra","Tahm Kench","Taliyah","Talon",
  "Taric","Teemo","Thresh","Tristana","Trundle","Tryndamere","Twisted Fate",
  "Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi",
  "Viego","Viktor","Vladimir","Volibear","Warwick","Wukong","Xayah","Xerath",
  "Xin Zhao","Yasuo","Yone","Yorick","Yuumi","Zac","Zed","Ziggs","Zilean",
  "Zoe","Zyra"
];

const ROLES = ["Top", "Jungle", "Mid", "Bot", "Support"];

export default function Home() {
  const [picks, setPicks] = useState({ Top: "", Jungle: "", Mid: "", Bot: "", Support: "" });
  const [activeSlot, setActiveSlot] = useState(null);
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = CHAMPIONS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const selectChampion = (champ: string) => {
    setPicks(prev => ({ ...prev, [activeSlot]: champ }));
    setActiveSlot(null);
    setSearch("");
  };

  const clearSlot = (e, role) => {
    e.stopPropagation();
    setPicks(prev => ({ ...prev, [role]: "" }));
    setRecommendations(null);
  };

  const getRecommendations = async () => {
    const filledCount = Object.values(picks).filter(p => p !== "").length;
    if (filledCount === 0) return alert("Please select at least one champion first!");
    setLoading(true);
    setRecommendations(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="flex items-baseline gap-1 mb-2">
        <h1 className="text-4xl font-bold text-white">Synergy</h1>
        <span className="text-4xl font-bold text-yellow-400">.GG</span>
      </div>
      <p className="text-gray-400 mb-12">Find the perfect pick for your team comp</p>

      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Your Team's Current Picks</h2>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {ROLES.map((role) => (
            <div key={role} className="flex flex-col items-center gap-2">
              <div
                onClick={() => { setActiveSlot(role); setSearch(""); }}
                className={`relative w-16 h-16 rounded-xl border-2 flex items-center justify-center text-xs cursor-pointer transition text-center px-1
                  ${picks[role]
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-300 font-semibold"
                    : "border-gray-700 bg-gray-800 text-gray-500 hover:border-yellow-400"
                  }`}
              >
                {picks[role] ? (
                  <>
                    <span>{picks[role]}</span>
                    <span
                      onClick={(e) => clearSlot(e, role)}
                      className="absolute -top-1 -right-1 bg-gray-700 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition"
                    >
                      ✕
                    </span>
                  </>
                ) : "Empty"}
              </div>
              <span className="text-xs text-gray-400">{role}</span>
            </div>
          ))}
        </div>

        <button
          onClick={getRecommendations}
          disabled={loading}
          className="w-full bg-yellow-400 text-gray-950 font-bold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-50"
        >
          {loading ? "Analyzing comp..." : "Recommend My Pick →"}
        </button>
      </div>

      {recommendations && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Recommended Picks</h2>
          <div className="grid grid-cols-1 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-yellow-400 font-bold text-lg">{rec.champion}</span>
                  <span className="text-gray-400 text-sm bg-gray-800 px-2 py-1 rounded-lg">{rec.role}</span>
                </div>
                <p className="text-gray-300 text-sm">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Pick for {activeSlot}</h3>
            <input
              autoFocus
              type="text"
              placeholder="Search champion..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-2 mb-4 text-white placeholder-gray-500 outline-none border border-gray-700 focus:border-yellow-400"
            />
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filtered.map(champ => (
                <button
                  key={champ}
                  onClick={() => selectChampion(champ)}
                  className="bg-gray-800 hover:bg-yellow-400 hover:text-gray-950 text-sm py-2 px-2 rounded-lg transition text-left"
                >
                  {champ}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveSlot(null)}
              className="mt-4 text-gray-500 hover:text-white text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}