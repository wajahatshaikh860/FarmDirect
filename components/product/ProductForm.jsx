"use client";
import ProductLocationFields from "@/components/phase4/ProductLocationFields";
import { LoaderCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  PRODUCT_GRADES,
  PRODUCT_FARMING_TYPES,
} from "@/lib/constants";
import { displayFarmingType } from "@/lib/productUtils";
import ProductImageUploader from "./ProductImageUploader";
import useProductForm from "./useProductForm";
export default function ProductForm({
  product,
  returnTo = "/farmer/products",
}) {
  const { busy, errors, files, setFiles, existing, setExisting, submit } =
    useProductForm(product, returnTo);
  function field(name, label, type = "text", props = {}) {
    const value = product?.[name] ?? product?.location?.[name] ?? "";
    return (
      <Input
        name={name}
        label={label}
        type={type}
        required={name !== "village" && name !== "harvestDate"}
        disabled={busy}
        defaultValue={
          name === "harvestDate" ? String(value).slice(0, 10) : value
        }
        error={errors[name] || errors["location." + name]}
        {...props}
      />
    );
  }
  function select(name, label, options, initial) {
    return (
      <label className="field">
        <span>{label}</span>
        <select
          name={name}
          required
          disabled={busy}
          defaultValue={product?.[name] || initial || ""}
        >
          <option value="" disabled>
            Select {label.toLowerCase()}
          </option>
          {options.map((value) => (
            <option key={value} value={value}>
              {name === "farmingType" ? displayFarmingType(value) : value}
            </option>
          ))}
        </select>
        {errors[name] && (
          <small className="field-error">{errors[name][0]}</small>
        )}
      </label>
    );
  }
  return (
    <form onSubmit={submit} className="product-form">
      <div className="product-form-grid">
        {field("name", "Product Name", "text", { maxLength: 120 })}
        {select("category", "Category", PRODUCT_CATEGORIES)}
        <label className="field product-form-wide">
          <span>Description</span>
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={3000}
            defaultValue={product?.description || ""}
            disabled={busy}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <small className="field-error">{errors.description[0]}</small>
          )}
        </label>
        {field("price", "Price (₹)", "number", { min: 0.01, step: "any" })}
        {select("unit", "Unit", PRODUCT_UNITS, "KG")}
        {field("availableQuantity", "Available Quantity", "number", {
          min: 0,
          step: "any",
        })}
        {field("minimumOrderQuantity", "Minimum Order Quantity", "number", {
          min: 0.01,
          step: "any",
        })}
        {field("harvestDate", "Harvest Date", "date")}
        {select("qualityGrade", "Quality Grade", PRODUCT_GRADES, "Grade A")}
        {select("farmingType", "Farming Type", PRODUCT_FARMING_TYPES)}
        <label className="field">
          <span>Listing visibility</span>
          <select
            name="status"
            defaultValue={
              product?.status === "DISABLED" ? "DISABLED" : "ACTIVE"
            }
            disabled={busy}
          >
            <option value="ACTIVE">Visible in marketplace</option>
            <option value="DISABLED">Hidden from marketplace</option>
          </select>
        </label>
        <ProductLocationFields location={product?.location} disabled={busy} errors={errors} />
      </div>
      <ProductImageUploader
        existing={existing}
        onExistingChange={setExisting}
        files={files}
        onFilesChange={setFiles}
        disabled={busy}
      />
      <p className="form-note">
        Zero stock is automatically marked out of stock.
      </p>
      {errors.form && (
        <p role="alert" className="field-error">
          {errors.form[0]}
        </p>
      )}
      <div className="product-form-actions">
        <Button type="submit" disabled={busy}>
          {busy && <LoaderCircle size={18} className="spin" />}
          {busy
            ? files.length
              ? "Uploading and saving…"
              : "Saving…"
            : product
              ? "Save Changes"
              : "Add Product"}
        </Button>
        <Button href={returnTo} variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
