"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type JsonSchema = Record<string, unknown>;

function initialValueFor(schema: JsonSchema): unknown {
  if ("default" in schema) return schema.default;
  if (schema.type === "array") return [];
  if (schema.type === "boolean") return false;
  return "";
}

function initialObject(schema: JsonSchema): Record<string, unknown> {
  const props = (schema.properties as Record<string, JsonSchema>) ?? {};
  return Object.fromEntries(Object.entries(props).map(([key, sub]) => [key, initialValueFor(sub)]));
}

/**
 * Renders a form straight from a tool's `inputSchema` (Section 9.5: "an
 * auto-generated input form from input_schema") — labels, helper text, and
 * required-ness all come from the schema, so a new tool needs no new form
 * code, just a schema. Handles the shapes the five launch tools actually
 * use: strings (long ones as a textarea), numbers, enums as a select,
 * string-enum arrays as checkboxes, and object arrays as repeatable rows
 * (Order Alert Composer's line items).
 */
export function AutoForm({ schema, onSubmit, submitting, submitLabel }: { schema: JsonSchema; onSubmit: (value: Record<string, unknown>) => void; submitting: boolean; submitLabel: string }) {
  const [value, setValue] = useState<Record<string, unknown>>(() => initialObject(schema));
  const properties = (schema.properties as Record<string, JsonSchema>) ?? {};
  const required = new Set((schema.required as string[]) ?? []);

  function set(key: string, v: unknown) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className="flex flex-col gap-5"
    >
      {Object.entries(properties).map(([key, field]) => (
        <Field key={key} name={key} schema={field} value={value[key]} required={required.has(key)} onChange={(v) => set(key, v)} />
      ))}
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({ name, schema, value, required, onChange }: { name: string; schema: JsonSchema; value: unknown; required: boolean; onChange: (v: unknown) => void }) {
  const label = (schema.title as string) ?? name;
  const type = schema.type as string | string[] | undefined;

  if (Array.isArray(schema.enum) || (type === "array" && Array.isArray((schema.items as JsonSchema)?.enum))) {
    const options = (Array.isArray(schema.enum) ? schema.enum : (schema.items as JsonSchema).enum) as string[];
    const isMulti = type === "array";
    if (isMulti) {
      const selected = new Set((value as string[]) ?? []);
      return (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            {label}
            {required ? <span className="text-coral-600"> *</span> : null}
          </p>
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => (
              <Checkbox
                key={opt}
                label={opt}
                checked={selected.has(opt)}
                onChange={() => {
                  const next = new Set(selected);
                  if (next.has(opt)) next.delete(opt);
                  else next.add(opt);
                  onChange(Array.from(next));
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <Select
        label={label}
        required={required}
        options={options.map((opt) => ({ value: opt, label: opt }))}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === "array" && (schema.items as JsonSchema)?.type === "object") {
    return <ObjectArrayField label={label} itemSchema={schema.items as JsonSchema} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} />;
  }

  if (type === "number" || type === "integer") {
    return (
      <Input
        label={label}
        type="number"
        required={required}
        min={schema.minimum as number | undefined}
        max={schema.maximum as number | undefined}
        step={type === "integer" ? 1 : "any"}
        value={value === "" ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  }

  const maxLength = schema.maxLength as number | undefined;
  if (maxLength && maxLength > 200) {
    return <Textarea label={label} required={required} maxLength={maxLength} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input label={label} required={required} maxLength={maxLength} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

function ObjectArrayField({ label, itemSchema, value, onChange }: { label: string; itemSchema: JsonSchema; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void }) {
  const props = (itemSchema.properties as Record<string, JsonSchema>) ?? {};

  function updateRow(index: number, key: string, v: unknown) {
    const next = value.map((row, i) => (i === index ? { ...row, [key]: v } : row));
    onChange(next);
  }
  function addRow() {
    onChange([...value, initialObject(itemSchema)]);
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-col gap-3">
        {value.map((row, index) => (
          <div key={index} className="flex items-end gap-2 rounded-xl border border-line/70 p-3">
            {Object.entries(props).map(([key, sub]) => (
              <div key={key} className="flex-1">
                <Field name={key} schema={sub} value={row[key]} required={false} onChange={(v) => updateRow(index, key, v)} />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)} aria-label="Remove row">
              <Trash2 aria-hidden="true" size={15} />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary-outline" size="sm" onClick={addRow} className="mt-2">
        <Plus aria-hidden="true" size={14} />
        Add item
      </Button>
    </div>
  );
}
