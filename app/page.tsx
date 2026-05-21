"use client";
import { useState } from "react";
import Image from "next/image";

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

const toImageKey = (name: string) =>
  name.replace(/\s+/g, "").replace(/'/g, "").replace(/\./g, "").replace("&", "and");

const PATCH = "14.10.1";
const champImg = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${PATCH}/img/champion/${toImageKey(name)}.png`;

type Role = "Top" | "Jungle" | "Mid" | "Bot" | "Support";
const ROLES: Role[] = ["Top", "Jungle", "Mid", "Bot", "Support"];
type Picks = Record<Role, string>;

interface Recommendation {
  champion: string;
  role: string;
  reason: string;
}

export default function Home() {
  const [picks, setPicks] = useState<Picks>({ Top: "", Jungle: "", Mid: "", Bot: "", Support: "" });
  const [enemies, setEnemies] = useState<Picks>({ Top: "", Jungle: "", Mid: "", Bot: "", Support: "" });
  const [activeSlot, setActiveSlot] = useState<{ team: "ally" | "enemy"; role: Role } | null>(null);
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = CHAMPIONS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const selectChampion = (champ: string) => {
    if (!activeSlot) return;
    if (activeSlot.team === "ally") {
      setPicks(prev => ({ ...prev, [activeSlot.role]: champ }));
    } else {
      setEnemies(prev => ({ ...prev, [activeSlot.role]: champ }));
    }
    setActiveSlot(null);
    setSearch("");
  };

  const clearSlot = (e: React.MouseEvent, team: "ally" | "enemy", role: Role) => {
    e.stopPropagation();
    if (team === "ally") setPicks(prev => ({ ...prev, [role]: "" }));
    else setEnemies(prev => ({ ...prev, [role]: "" }));
    setRecommendations(null);
  };

  const getRecommendations = async () => {
    const filledCount = Object.values(picks).filter(p => p !== "").length;
    if (filledCount === 0) return alert("Please select at least one ally champion first!");
    setLoading(true);
    setRecommendations(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks, enemies }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations);
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const renderSlot = (team: "ally" | "enemy", role: Role) => {
    const champ = team === "ally" ? picks[role] : enemies[role];
    const isAlly = team === "ally";
    return (
      <div key={role} className="flex flex-col items-center gap-2">
        <div
          onClick={() => { setActiveSlot({ team, role }); setSearch(""); }}
          className={`relative w-16 h-16 rounded-xl border-2 cursor-pointer transition overflow-hidden
            ${champ
              ? isAlly ? "border-yellow-400" : "border-red-500"
              : isAlly ? "border-gray-700 bg-gray-800 hover:border-yellow-400" : "border-gray-700 bg-gray-800 hover:border-red-500"
            }`}
        >
          {champ ? (
            <>
              <Image src={champImg(champ)} alt={champ} fill className="object-cover" unoptimized />
              <span
                onClick={(e) => clearSlot(e, team, role)}
                className="absolute -top-1 -right-1 bg-gray-700 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition z-10"
              >
                ✕
              </span>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Empty</div>
          )}
        </div>
        <span className="text-xs text-gray-400">{role}</span>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="flex items-baseline gap-1 mb-2">
        <h1 className="text-4xl font-bold text-white">Synergy</h1>
        <span className="text-4xl font-bold text-yellow-400">.GG</span>
      </div>
      <p className="text-gray-400 mb-12">Find the perfect pick for your team comp</p>

      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-2xl shadow-xl">

        <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">Your Team</h2>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {ROLES.map(role => renderSlot("ally", role))}
        </div>

        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Enemy Team</h2>
        <div className="grid grid-cols-5 gap-3 mb-8">
          {ROLES.map(role => renderSlot("enemy", role))}
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
              <div key={i} className="bg-gray-900 rounded-2xl p-6 shadow-xl flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-yellow-400">
                  <Image src={champImg(rec.champion)} alt={rec.champion} fill className="object-cover" unoptimized />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-yellow-400 font-bold text-lg">{rec.champion}</span>
                    <span className="text-gray-400 text-sm bg-gray-800 px-2 py-1 rounded-lg">{rec.role}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Pick for {activeSlot.team === "ally" ? "Your Team" : "Enemy Team"} — {activeSlot.role}
            </h3>
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
                  className="bg-gray-800 hover:bg-yellow-400 hover:text-gray-950 text-sm py-2 px-2 rounded-lg transition flex items-center gap-2"
                >
                  <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                    <Image src={champImg(champ)} alt={champ} fill className="object-cover" unoptimized />
                  </div>
                  <span className="truncate">{champ}</span>
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