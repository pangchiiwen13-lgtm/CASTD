"use client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface Filters {
  content_type: string;
  language: string;
  gender: string;
  sort_by: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const CONTENT_TYPES = ["Lifestyle", "Beauty", "Skincare", "Fashion", "Wellness", "Food", "Fitness"];
const LANGUAGES = ["English", "Mandarin", "Malay", "Tamil"];
const GENDERS = ["Female", "Male", "Non-binary"];

export function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof Filters) => (val: string | null) =>
    onChange({ ...filters, [key]: !val || val === "all" ? "" : val });

  const hasFilters = Object.values(filters).some((v) => v && v !== "name");

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Content type</Label>
        <Select value={filters.content_type || "all"} onValueChange={set("content_type")}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Language</Label>
        <Select value={filters.language || "all"} onValueChange={set("language")}>
          <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Gender</Label>
        <Select value={filters.gender || "all"} onValueChange={set("gender")}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <Select value={filters.sort_by || "name"} onValueChange={set("sort_by")}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="fit_score">Best match</SelectItem>
            <SelectItem value="followers">Followers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onChange({ content_type: "", language: "", gender: "", sort_by: "name" })}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
