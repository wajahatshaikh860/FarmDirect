import Input from "@/components/ui/Input";
import { FARMING_TYPES } from "@/lib/constants";
export default function FarmFields({ errors }) {
  return (
    <fieldset>
      <legend>Your farm</legend>
      <Input
        name="farmName"
        label="Farm name"
        required
        maxLength={100}
        error={errors.farmName}
      />
      <div className="field-grid">
        <Input
          name="district"
          label="District"
          required
          maxLength={100}
          error={errors.district}
        />
        <Input
          name="state"
          label="State"
          required
          maxLength={100}
          error={errors.state}
        />
      </div>
      <label className="field">
        <span>Farming type</span>
        <select name="farmingType" required defaultValue="">
          <option value="" disabled>
            Select farming type
          </option>
          {FARMING_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {errors.farmingType && (
          <small className="field-error">{errors.farmingType[0]}</small>
        )}
      </label>
    </fieldset>
  );
}
