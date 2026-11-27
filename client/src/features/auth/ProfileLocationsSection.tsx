import React from "react";
import { MapPin, Plus, X } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
} from "../../components/ui/Primitives";

const COMMON_LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Remote",
];

export interface ProfileLocationsSectionProps {
  preferredLocations: string[];
  customLocation: string;
  disabled: boolean;
  onToggleLocation: (loc: string) => void;
  onCustomLocationChange: (value: string) => void;
  onAddLocation: () => void;
  onRemoveLocation: (loc: string) => void;
}

export const ProfileLocationsSection: React.FC<
  ProfileLocationsSectionProps
> = ({
  preferredLocations,
  customLocation,
  disabled,
  onToggleLocation,
  onCustomLocationChange,
  onAddLocation,
  onRemoveLocation,
}) => {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-xs font-medium text-content-heading">
        Preferred work locations
      </p>

      <div className="flex flex-wrap gap-2">
        {COMMON_LOCATIONS.map((loc) => {
          const selected = preferredLocations.includes(loc);
          return (
            <Button
              key={loc}
              type="button"
              variant={selected ? "primary" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => onToggleLocation(loc)}
              leftIcon={<MapPin className="h-3.5 w-3.5" />}
            >
              {loc}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          label="Add custom city or remote preference"
          placeholder="e.g., Gurugram, Hybrid"
          value={customLocation}
          disabled={disabled}
          onChange={(e) => onCustomLocationChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddLocation();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={onAddLocation}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add location
        </Button>
      </div>

      {preferredLocations.length === 0 ? (
        <EmptyState
          title="No locations selected"
          description="Select at least one city or Remote to filter job listings."
        />
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {preferredLocations.map((loc) => (
            <Badge key={loc} tone="primary">
              <span>{loc}</span>
              <button
                type="button"
                onClick={() => onRemoveLocation(loc)}
                aria-label={`Remove ${loc}`}
                className="ml-1 rounded-sm p-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileLocationsSection;
