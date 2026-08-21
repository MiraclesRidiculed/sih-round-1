import { Search } from "lucide-react";

const SearchBar = ({ value, onChange }) => (
  <label className="flex items-center gap-3 rounded-[1.5rem] border border-earth-200/80 bg-white/85 px-4 py-4 shadow-panel backdrop-blur">
    <Search className="text-earth-500" size={20} />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-transparent text-base text-earth-900 outline-none placeholder:text-earth-400"
      placeholder="Search by ULPIN, survey number, hissa, village, taluk, or district"
    />
  </label>
);

export default SearchBar;

