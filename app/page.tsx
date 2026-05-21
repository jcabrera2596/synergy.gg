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

const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Rek'Sai": "RekSai",
  "Vel'Koz": "Velkoz",
  "Cho'Gath": "Chogath",
  "Kog'Maw": "KogMaw",
  "Dr. Mundo": "DrMundo",
  "Aurelion Sol": "AurelionSol",
  "Jarvan IV": "JarvanIV",
  "Lee Sin": "LeeSin",
  "Master Yi": "MasterYi",
  "Miss Fortune": "MissFortune",
  "Renata Glasc": "Renata",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Xin Zhao": "XinZhao",
};

const toImageKey = (name: string) =>
  CHAMPION_KEY_OVERRIDES[name] ?? name.replace(/\s+/g, "").replace(/'/g, "").replace(/\./g, "").replace("&", "and");

const PATCH = "14.10.1";
const champImg = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${PATCH}/img/champion/${toImageKey(name)}.png`;

type Role = "Top" | "Jungle" | "Mid" | "Bot" | "Support";
const ROLES: Role[] = ["Top", "Jungle", "Mid", "Bot", "Support"];
type Picks = Record<Role, string>;

interface Analysis {
  engage: number;
  damage: number;
  peel: number;
  scaling: number;
  crowdControl: number;
  winCondition: string;
}

interface Recommendation {
  champion: string;
  role: string;
  reason: string;
}

const StatBar = ({ label, value }: { label: string; value: number }) => {
  const color =
    value >= 4 ? "bg-green-400" :
    value >= 3 ? "bg-yellow-400" :
    "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-xs w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-4">{value}/5</span>
    </div>
  );
};

export default function Home() {
  const [picks, setPicks] = useState<Picks>({ Top: "", Jungle: "", Mid: "", Bot: "", Support: "" });
  const [enemies, setEnemies] = useState<Picks>({ Top: "", Jungle: "", Mid: "", Bot: "", Support: "" });
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [activeSlot, setActiveSlot] = useState<{ team: "ally" | "enemy"; role: Role } | null>(null);
  const [search, setSearch] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
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
    setAnalysis(null);
    setRecommendations(null);
  };

  const getRecommendations = async () => {
    const filledCount = Object.values(picks).filter(p => p !== "").length;
    if (filledCount === 0) return alert("Please select at least one ally champion first!");
    if (!myRole) return alert("Please select your role first!");
    setLoading(true);
    setAnalysis(null);
    setRecommendations(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks, enemies, myRole }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
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
      <div key={role} className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-500">{role}</span>
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
        <span className="text-xs text-center leading-tight w-16 truncate text-yellow-300">
          {champ ? champ : ""}
        </span>
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

        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Role</h2>
        <div className="grid grid-cols-5 gap-2 mb-8">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setMyRole(role)}
              className={`py-2 rounded-xl text-sm font-semibold transition border-2
                ${myRole === role
                  ? "bg-yellow-400 text-gray-950 border-yellow-400"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:border-yellow-400"
                }`}
            >
              {role}
            </button>
          ))}
        </div>

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
          {loading ? "Analyzing comp..." : "Analyze & Recommend →"}
        </button>
      </div>

      {analysis && (
        <div className="mt-8 w-full max-w-2xl bg-gray-900 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Comp Analysis</h2>
          <div className="flex flex-col gap-3 mb-4">
            <StatBar label="Engage" value={analysis.engage} />
            <StatBar label="Damage" value={analysis.damage} />
            <StatBar label="Peel" value={analysis.peel} />
            <StatBar label="Scaling" value={analysis.scaling} />
            <StatBar label="Crowd Control" value={analysis.crowdControl} />
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Win Condition</span>
            <p className="text-white text-sm mt-1">{analysis.winCondition}</p>
          </div>
        </div>
      )}

      {recommendations && (
        <div className="mt-6 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Recommended {myRole} Picks</h2>
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